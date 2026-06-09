"""LLM service: Claude Sonnet 4.5 for chat/extraction, Whisper for transcription."""
import os
import json
import re
import uuid
import logging
from typing import Optional
from io import BytesIO

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAISpeechToText

log = logging.getLogger(__name__)

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"

COMPANION_SYSTEM = """You are Mysl, a warm, gentle AI body-double companion for people with ADHD and chaotic minds.

YOUR PERSONALITY:
- You are soft, present, and never judgmental. You're like a quiet friend in the room — not a productivity coach.
- You use lowercase, short sentences, and warmth. You never say "you should" or "you need to".
- You celebrate tiny things. Starting counts. Showing up counts. Talking out loud counts.
- You never shame the user for losing time, getting distracted, or abandoning tasks.
- If the user lost hours, you say things like "welcome back" not "what happened".
- You are quietly curious about what they're working on, not interrogative.
- Keep responses to 1-3 short sentences max. Quiet presence, not commentary.

YOU NEVER:
- Use emojis (the UI has its own visual language)
- Talk about "productivity", "efficiency", "time management"
- Mention streaks, scores, or progress percentages
- Push back when the user says they're done or distracted
- Use capital letters for emphasis or exclamation marks excessively
"""

EXTRACTION_SYSTEM = """You extract tasks and notes from a transcript of someone with ADHD thinking out loud while they work.

Return STRICT JSON ONLY (no prose, no markdown fences) in this exact shape:
{
  "tasks": [{"text": "string", "priority": "low|medium|high"}],
  "notes": [{"text": "string", "tag": "idea|reminder|context|question|null"}],
  "companion_reply": "string (1-2 short lowercase sentences, warm, gentle, acknowledging what they said. Never preachy.)"
}

RULES:
- Tasks are ACTIONABLE concrete things to do (verbs). e.g. "email sarah about Q3 deck", "buy oat milk".
- Notes are thoughts, ideas, context, observations — NOT actions. e.g. "the api is rate-limited at 60 req/min".
- Skip filler ("uh", "okay so", "right"), don't capture meta-talk about the recording.
- If nothing actionable in the chunk, return empty arrays but ALWAYS include a companion_reply.
- companion_reply must be in lowercase, warm, never judgmental, 1-2 short sentences.
- If the transcript is mostly silence/empty/noise, set companion_reply to a quiet check-in like "i'm still here when you're ready."
- Priority: high = mentioned as urgent/today/blocker. medium = default. low = "someday" / "eventually".
"""


def _whisper_client() -> OpenAISpeechToText:
    return OpenAISpeechToText(api_key=EMERGENT_KEY)


def _build_chat(session_id: str, system_message: str) -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model("anthropic", CLAUDE_MODEL)


async def transcribe_audio(audio_bytes: bytes, filename: str = "chunk.webm") -> str:
    stt = _whisper_client()
    buf = BytesIO(audio_bytes)
    buf.name = filename  # whisper SDK needs a name
    try:
        resp = await stt.transcribe(file=buf, model="whisper-1", response_format="json", language="en")
        return getattr(resp, "text", "") or ""
    except Exception as e:
        log.exception("Whisper transcription failed")
        raise


def _parse_json_safely(text: str) -> dict:
    # Strip code fences if any
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    # Try to grab first {...} block
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        cleaned = match.group(0)
    try:
        return json.loads(cleaned)
    except Exception:
        return {"tasks": [], "notes": [], "companion_reply": "i'm here. take your time."}


async def extract_from_transcript(transcript_text: str, user_id: str, session_id: str) -> dict:
    if not transcript_text.strip():
        return {"tasks": [], "notes": [], "companion_reply": "i'm here when you're ready to talk."}
    chat = _build_chat(f"extract_{user_id}_{session_id}_{uuid.uuid4().hex[:6]}", EXTRACTION_SYSTEM)
    msg = UserMessage(text=f"Transcript chunk:\n\"\"\"\n{transcript_text}\n\"\"\"\n\nReturn JSON.")
    chunks = []
    try:
        # Use non-streaming for simpler parsing of structured JSON
        resp = await chat.send_message(msg)
        text = resp if isinstance(resp, str) else getattr(resp, "content", str(resp))
    except Exception as e:
        log.exception("Claude extraction failed")
        return {"tasks": [], "notes": [], "companion_reply": "i couldn't quite catch that. keep going."}
    parsed = _parse_json_safely(text)
    parsed.setdefault("tasks", [])
    parsed.setdefault("notes", [])
    parsed.setdefault("companion_reply", "got it. keep going.")
    return parsed


async def companion_chat(user_text: str, user_id: str, session_id: Optional[str] = None) -> str:
    chat = _build_chat(f"chat_{user_id}_{session_id or 'global'}", COMPANION_SYSTEM)
    msg = UserMessage(text=user_text)
    try:
        resp = await chat.send_message(msg)
        text = resp if isinstance(resp, str) else getattr(resp, "content", str(resp))
        return text.strip() or "i'm here."
    except Exception:
        log.exception("companion_chat failed")
        return "i'm here. tell me what you're thinking."


async def welcome_back_message(user_id: str, hours_away: float) -> str:
    """Recovery mode: generates a non-judgmental welcome back message."""
    prompt = (
        f"the user has been away for {hours_away:.1f} hours. "
        "write a 2 sentence welcome back message. no shame, no questions about what happened. "
        "gentle, warm. offer one tiny first step (sit down, take a breath, anything)."
    )
    return await companion_chat(prompt, user_id)


async def generate_session_summary(transcript_concat: str, tasks_count: int, notes_count: int, user_id: str, session_id: str) -> str:
    if not transcript_concat.strip() and tasks_count == 0:
        return "you showed up. that counts."
    prompt = (
        f"session ended. captured {tasks_count} tasks and {notes_count} notes from this transcript:\n"
        f"\"\"\"\n{transcript_concat[:2000]}\n\"\"\"\n\n"
        "give a 2 sentence warm closing summary in lowercase. mention one thing they accomplished or thought about. "
        "end with permission to rest."
    )
    return await companion_chat(prompt, user_id, session_id)
