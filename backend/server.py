"""Mysl backend — FastAPI app."""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Response, Cookie, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from collections import Counter
from typing import Optional, List

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import httpx  # noqa: F401  (kept for auth.py)

from db import (
    db, users, sessions_col, focus_sessions, tasks_col,
    notes_col, transcripts, companion_messages,
)
from models import (
    User, UserOut, RegisterIn, LoginIn, GoogleSessionIn, StartSessionIn,
    EndSessionIn, FocusSession, Task, Note, Transcript, CompanionMessage,
    TaskUpdateIn, NoteUpdateIn, CompanionChatIn, VoicePrefIn,
)
from auth import (
    register_with_password, login_with_password, exchange_google_session,
    get_current_user, logout_user,
)
from llm_service import (
    transcribe_audio, extract_from_transcript, companion_chat,
    welcome_back_message, generate_session_summary, synthesize_speech,
)
from fastapi.responses import Response as FastAPIResponse, StreamingResponse
from io import BytesIO
from pydantic import BaseModel

app = FastAPI(title="Mysl API")
api = APIRouter(prefix="/api")

log = logging.getLogger("mysl")
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s - %(message)s')


# ---------- Health ----------
@api.get("/")
async def root():
    return {"service": "mysl", "status": "ok"}


# ---------- Auth ----------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    return await register_with_password(body.email, body.password, body.name, response)


@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    return await login_with_password(body.email, body.password, response)


@api.post("/auth/google/session")
async def google_session(body: GoogleSessionIn, response: Response):
    return await exchange_google_session(body.session_id, response)


@api.post("/auth/logout")
async def logout(
    response: Response,
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
    user: User = Depends(get_current_user),
):
    return await logout_user(response, session_token=session_token, authorization=authorization)


VALID_VOICES = ("alloy", "ash", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer")


@api.get("/auth/me")
async def me(user: User = Depends(get_current_user)):
    return UserOut(
        user_id=user.user_id, email=user.email, name=user.name, picture=user.picture,
        voice=user.voice or "coral",
    ).model_dump()


@api.patch("/auth/voice")
async def update_voice(body: VoicePrefIn, user: User = Depends(get_current_user)):
    if body.voice not in VALID_VOICES:
        raise HTTPException(status_code=400, detail="invalid voice")
    await users.update_one({"user_id": user.user_id}, {"$set": {"voice": body.voice}})
    return {"voice": body.voice}


# ---------- Focus sessions ----------
@api.post("/sessions/start")
async def start_session(body: StartSessionIn, user: User = Depends(get_current_user)):
    fs = FocusSession(
        user_id=user.user_id,
        title=(body.title or "Focus session").strip()[:80],
        intent=(body.intent or "").strip()[:300] or None,
    )
    await focus_sessions.insert_one(fs.model_dump())

    # Companion intro line
    intro_seed = (
        f"the user just started a focus session. their intent: '{body.intent or 'just to sit and work'}'. "
        "say one warm lowercase opening line (max 12 words). no commands."
    )
    try:
        intro = await companion_chat(intro_seed, user.user_id, fs.session_id)
    except Exception:
        intro = "i'm here. take your time."
    cm = CompanionMessage(
        user_id=user.user_id, session_id=fs.session_id, role="companion", text=intro,
    )
    await companion_messages.insert_one(cm.model_dump())

    return {"session": fs.model_dump(), "companion_message": cm.model_dump()}


@api.post("/sessions/{session_id}/end")
async def end_session(session_id: str, body: EndSessionIn, user: User = Depends(get_current_user)):
    fs = await focus_sessions.find_one({"session_id": session_id, "user_id": user.user_id}, {"_id": 0})
    if not fs:
        raise HTTPException(status_code=404, detail="Session not found")
    if fs.get("ended_at"):
        return {"session": fs, "summary": "already closed."}

    ended = datetime.now(timezone.utc)
    started = datetime.fromisoformat(fs["started_at"])
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    duration = int((ended - started).total_seconds())

    # Aggregate
    task_docs = await tasks_col.find({"session_id": session_id, "user_id": user.user_id}, {"_id": 0}).to_list(1000)
    note_docs = await notes_col.find({"session_id": session_id, "user_id": user.user_id}, {"_id": 0}).to_list(1000)
    ts_docs = await transcripts.find({"session_id": session_id, "user_id": user.user_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    transcript_text = " ".join([t["text"] for t in ts_docs])

    summary = await generate_session_summary(
        transcript_text, len(task_docs), len(note_docs), user.user_id, session_id,
    )

    notion_synced_at = datetime.now(timezone.utc).isoformat()  # mock sync

    await focus_sessions.update_one(
        {"session_id": session_id},
        {"$set": {
            "ended_at": ended.isoformat(),
            "duration_seconds": duration,
            "task_count": len(task_docs),
            "note_count": len(note_docs),
            "notion_synced_at": notion_synced_at,
            "mood_after": body.mood_after,
        }},
    )

    cm = CompanionMessage(
        user_id=user.user_id, session_id=session_id, role="companion", text=summary,
    )
    await companion_messages.insert_one(cm.model_dump())

    updated = await focus_sessions.find_one({"session_id": session_id}, {"_id": 0})
    return {"session": updated, "summary": summary}


@api.get("/sessions")
async def list_sessions(user: User = Depends(get_current_user)):
    docs = await focus_sessions.find({"user_id": user.user_id}, {"_id": 0}).sort("started_at", -1).to_list(200)
    return {"sessions": docs}


@api.get("/sessions/{session_id}")
async def get_session(session_id: str, user: User = Depends(get_current_user)):
    fs = await focus_sessions.find_one({"session_id": session_id, "user_id": user.user_id}, {"_id": 0})
    if not fs:
        raise HTTPException(status_code=404, detail="Session not found")
    task_docs = await tasks_col.find({"session_id": session_id, "user_id": user.user_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    note_docs = await notes_col.find({"session_id": session_id, "user_id": user.user_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    ts_docs = await transcripts.find({"session_id": session_id, "user_id": user.user_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    msg_docs = await companion_messages.find({"session_id": session_id, "user_id": user.user_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return {
        "session": fs,
        "tasks": task_docs,
        "notes": note_docs,
        "transcripts": ts_docs,
        "messages": msg_docs,
    }


# ---------- Voice ----------
@api.post("/voice/transcribe")
async def voice_transcribe(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    fs = await focus_sessions.find_one({"session_id": session_id, "user_id": user.user_id}, {"_id": 0})
    if not fs:
        raise HTTPException(status_code=404, detail="Session not found")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio")

    filename = audio.filename or "chunk.webm"
    try:
        text = await transcribe_audio(audio_bytes, filename=filename)
    except Exception as e:
        log.exception("transcribe failed")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")

    text = (text or "").strip()
    if not text:
        return {"transcript": "", "tasks": [], "notes": [], "companion_message": None}

    ts = Transcript(user_id=user.user_id, session_id=session_id, text=text)
    await transcripts.insert_one(ts.model_dump())

    extracted = await extract_from_transcript(text, user.user_id, session_id)

    saved_tasks: List[dict] = []
    for t in extracted.get("tasks", []) or []:
        if not isinstance(t, dict):
            continue
        text_t = (t.get("text") or "").strip()
        if not text_t:
            continue
        pri = t.get("priority") if t.get("priority") in ("low", "medium", "high") else "medium"
        task = Task(user_id=user.user_id, session_id=session_id, text=text_t, priority=pri)
        await tasks_col.insert_one(task.model_dump())
        saved_tasks.append(task.model_dump())

    saved_notes: List[dict] = []
    for n in extracted.get("notes", []) or []:
        if not isinstance(n, dict):
            continue
        text_n = (n.get("text") or "").strip()
        if not text_n:
            continue
        note = Note(user_id=user.user_id, session_id=session_id, text=text_n, tag=n.get("tag"))
        await notes_col.insert_one(note.model_dump())
        saved_notes.append(note.model_dump())

    companion_reply = (extracted.get("companion_reply") or "").strip() or "got it."
    cm = CompanionMessage(
        user_id=user.user_id, session_id=session_id, role="companion", text=companion_reply,
    )
    await companion_messages.insert_one(cm.model_dump())

    return {
        "transcript": ts.model_dump(),
        "tasks": saved_tasks,
        "notes": saved_notes,
        "companion_message": cm.model_dump(),
    }


# ---------- Tasks ----------
@api.get("/tasks")


# ---------- Companion voice (TTS) ----------
class SpeakIn(BaseModel):
    text: str
    voice: Optional[str] = "coral"


@api.post("/companion/speak")
async def companion_speak(body: SpeakIn, user: User = Depends(get_current_user)):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty text")
    # Prefer explicit voice in request, else user pref, else coral.
    voice = body.voice or user.voice or "coral"
    if voice not in VALID_VOICES:
        voice = "coral"
    try:
        audio = await synthesize_speech(text, voice=voice)
    except Exception as e:
        log.exception("tts failed")
        raise HTTPException(status_code=500, detail=f"tts failed: {e}")
    return StreamingResponse(
        BytesIO(audio),
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-store"},
    )
async def list_tasks(session_id: Optional[str] = None, user: User = Depends(get_current_user)):
    q = {"user_id": user.user_id}
    if session_id:
        q["session_id"] = session_id
    docs = await tasks_col.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"tasks": docs}


@api.patch("/tasks/{task_id}")
async def update_task(task_id: str, body: TaskUpdateIn, user: User = Depends(get_current_user)):
    update = {}
    if body.text is not None:
        update["text"] = body.text.strip()
    if body.priority is not None:
        update["priority"] = body.priority
    if body.completed is not None:
        update["completed"] = body.completed
        update["completed_at"] = datetime.now(timezone.utc).isoformat() if body.completed else None
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await tasks_col.update_one({"task_id": task_id, "user_id": user.user_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    doc = await tasks_col.find_one({"task_id": task_id}, {"_id": 0})
    return {"task": doc}


@api.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user)):
    res = await tasks_col.delete_one({"task_id": task_id, "user_id": user.user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}


# ---------- Notes ----------
@api.get("/notes")
async def list_notes(session_id: Optional[str] = None, user: User = Depends(get_current_user)):
    q = {"user_id": user.user_id}
    if session_id:
        q["session_id"] = session_id
    docs = await notes_col.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"notes": docs}


@api.patch("/notes/{note_id}")
async def update_note(note_id: str, body: NoteUpdateIn, user: User = Depends(get_current_user)):
    update = {}
    if body.text is not None:
        update["text"] = body.text.strip()
    if body.tag is not None:
        update["tag"] = body.tag
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await notes_col.update_one({"note_id": note_id, "user_id": user.user_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    doc = await notes_col.find_one({"note_id": note_id}, {"_id": 0})
    return {"note": doc}


@api.delete("/notes/{note_id}")
async def delete_note(note_id: str, user: User = Depends(get_current_user)):
    res = await notes_col.delete_one({"note_id": note_id, "user_id": user.user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"ok": True}


# ---------- Companion chat ----------
@api.post("/companion/chat")
async def companion(body: CompanionChatIn, user: User = Depends(get_current_user)):
    user_msg = CompanionMessage(
        user_id=user.user_id, session_id=body.session_id, role="user", text=body.message[:1000]
    )
    await companion_messages.insert_one(user_msg.model_dump())
    reply = await companion_chat(body.message[:1000], user.user_id, body.session_id)
    bot_msg = CompanionMessage(
        user_id=user.user_id, session_id=body.session_id, role="companion", text=reply,
    )
    await companion_messages.insert_one(bot_msg.model_dump())
    return {"reply": bot_msg.model_dump()}


# ---------- Insights / patterns ----------
@api.get("/insights")
async def insights(user: User = Depends(get_current_user)):
    docs = await focus_sessions.find({"user_id": user.user_id, "ended_at": {"$ne": None}}, {"_id": 0}).to_list(500)
    if not docs:
        return {
            "total_sessions": 0,
            "total_minutes": 0,
            "total_tasks": 0,
            "total_notes": 0,
            "best_hour": None,
            "best_day": None,
            "recent": [],
            "insight_text": "no patterns yet. that's fine — start one tiny session and we'll learn together.",
        }

    total_minutes = sum(d.get("duration_seconds", 0) for d in docs) // 60
    total_tasks = sum(d.get("task_count", 0) for d in docs)
    total_notes = sum(d.get("note_count", 0) for d in docs)

    hour_counter = Counter()
    day_counter = Counter()
    for d in docs:
        try:
            dt = datetime.fromisoformat(d["started_at"])
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            hour_counter[dt.hour] += d.get("task_count", 0) + 1
            day_counter[dt.strftime("%A")] += d.get("task_count", 0) + 1
        except Exception:
            pass

    best_hour = hour_counter.most_common(1)[0][0] if hour_counter else None
    best_day = day_counter.most_common(1)[0][0] if day_counter else None

    def hour_label(h):
        if h is None:
            return None
        suf = "am" if h < 12 else "pm"
        hh = h % 12 or 12
        return f"{hh}{suf}"

    insight_lines = []
    if best_hour is not None:
        insight_lines.append(f"you tend to show up best around {hour_label(best_hour)}.")
    if best_day:
        insight_lines.append(f"{best_day.lower()}s seem to work for you.")
    insight_lines.append("no pressure though — patterns are just hints, not rules.")

    return {
        "total_sessions": len(docs),
        "total_minutes": total_minutes,
        "total_tasks": total_tasks,
        "total_notes": total_notes,
        "best_hour": hour_label(best_hour),
        "best_day": best_day,
        "recent": docs[:5],
        "insight_text": " ".join(insight_lines),
    }


# ---------- Recovery mode ----------
@api.get("/recovery/check")
async def recovery_check(user: User = Depends(get_current_user)):
    last = await focus_sessions.find_one(
        {"user_id": user.user_id}, {"_id": 0}, sort=[("started_at", -1)]
    )
    if not last:
        return {"should_recover": False, "hours_away": 0, "message": None}
    started = datetime.fromisoformat(last["started_at"])
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    delta = datetime.now(timezone.utc) - started
    hours = delta.total_seconds() / 3600
    if hours < 4:
        return {"should_recover": False, "hours_away": hours, "message": None}
    msg = await welcome_back_message(user.user_id, hours)
    return {"should_recover": True, "hours_away": hours, "message": msg}


# ---------- Notion (mock) ----------
@api.get("/notion/status")
async def notion_status(user: User = Depends(get_current_user)):
    last = await focus_sessions.find_one(
        {"user_id": user.user_id, "notion_synced_at": {"$ne": None}},
        {"_id": 0},
        sort=[("notion_synced_at", -1)],
    )
    return {
        "connected": True,  # mocked
        "workspace": "Mysl Workspace (mock)",
        "last_synced_at": last["notion_synced_at"] if last else None,
    }


# ---------- App wiring ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    pass
