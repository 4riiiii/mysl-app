"""Pydantic models for Mysl."""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal
from datetime import datetime, timezone
import uuid


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    auth_provider: Literal["google", "password"] = "password"
    created_at: str = Field(default_factory=_now)


class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class GoogleSessionIn(BaseModel):
    session_id: str


class StartSessionIn(BaseModel):
    title: Optional[str] = None
    intent: Optional[str] = None  # what user wants to work on


class FocusSession(BaseModel):
    session_id: str = Field(default_factory=lambda: _uid("fs"))
    user_id: str
    title: str = "Focus session"
    intent: Optional[str] = None
    started_at: str = Field(default_factory=_now)
    ended_at: Optional[str] = None
    duration_seconds: int = 0
    task_count: int = 0
    note_count: int = 0
    notion_synced_at: Optional[str] = None
    mood_before: Optional[str] = None
    mood_after: Optional[str] = None


class Task(BaseModel):
    task_id: str = Field(default_factory=lambda: _uid("task"))
    user_id: str
    session_id: str
    text: str
    completed: bool = False
    priority: Literal["low", "medium", "high"] = "medium"
    created_at: str = Field(default_factory=_now)
    completed_at: Optional[str] = None


class Note(BaseModel):
    note_id: str = Field(default_factory=lambda: _uid("note"))
    user_id: str
    session_id: str
    text: str
    tag: Optional[str] = None
    created_at: str = Field(default_factory=_now)


class Transcript(BaseModel):
    transcript_id: str = Field(default_factory=lambda: _uid("ts"))
    user_id: str
    session_id: str
    text: str
    created_at: str = Field(default_factory=_now)


class CompanionMessage(BaseModel):
    message_id: str = Field(default_factory=lambda: _uid("msg"))
    user_id: str
    session_id: Optional[str] = None
    role: Literal["user", "companion"] = "companion"
    text: str
    created_at: str = Field(default_factory=_now)


class TaskUpdateIn(BaseModel):
    text: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[Literal["low", "medium", "high"]] = None


class NoteUpdateIn(BaseModel):
    text: Optional[str] = None
    tag: Optional[str] = None


class CompanionChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None


class EndSessionIn(BaseModel):
    mood_after: Optional[str] = None
