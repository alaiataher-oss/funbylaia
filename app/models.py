from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


class Question(BaseModel):
    id: str
    question: str
    followUp: Optional[str] = None
    primaryCategory: str
    occasions: list[str]
    settings: list[str]
    relationships: list[str]
    closeness: list[str]
    depth: str
    feelings: list[str] = Field(default_factory=list)
    themes: list[str] = Field(default_factory=list)
    groupSafe: bool
    sensitivity: str
    status: str = "active"
    timesShown: int = 0
    createdAt: str
    updatedAt: str

    @field_validator("question")
    @classmethod
    def must_be_question(cls, v: str) -> str:
        v = v.strip()
        if not v.endswith("?"):
            raise ValueError("Question text must end with a question mark")
        if len(v) < 8:
            raise ValueError("Question text is too short")
        return v


class QuestionCreate(BaseModel):
    question: str
    followUp: Optional[str] = None
    primaryCategory: str
    occasions: list[str]
    settings: list[str]
    relationships: list[str]
    closeness: list[str]
    depth: str
    feelings: list[str] = Field(default_factory=list)
    themes: list[str] = Field(default_factory=list)
    groupSafe: bool = True
    sensitivity: str = "low"
    status: str = "active"


class QuestionUpdate(BaseModel):
    question: Optional[str] = None
    followUp: Optional[str] = None
    primaryCategory: Optional[str] = None
    occasions: Optional[list[str]] = None
    settings: Optional[list[str]] = None
    relationships: Optional[list[str]] = None
    closeness: Optional[list[str]] = None
    depth: Optional[str] = None
    feelings: Optional[list[str]] = None
    themes: Optional[list[str]] = None
    groupSafe: Optional[bool] = None
    sensitivity: Optional[str] = None
    status: Optional[str] = None


class DeckRequest(BaseModel):
    occasion: str
    setting: str
    relationship: str
    closeness: str
    depth: str
    feelings: list[str] = Field(default_factory=list)
    count: int = Field(default=10, ge=1, le=30)
    recentQuestionIds: list[str] = Field(default_factory=list)
    previousDeckIds: list[str] = Field(default_factory=list)


class DeckQuestion(BaseModel):
    id: str
    question: str
    followUp: Optional[str] = None
    depth: str
    contextLabel: str
    sensitivity: str


class DeckResponse(BaseModel):
    deckId: str
    questions: list[DeckQuestion]
    requested: int
    returned: int
    notice: Optional[str] = None
    filters: dict[str, Any]


class ChangeLogEntry(BaseModel):
    changeId: str
    timestamp: str
    questionId: str
    action: str
    changedFields: list[str] = Field(default_factory=list)
    previousValue: Any = None
    newValue: Any = None
    changedBy: str = "admin"
    syncStatus: str = "pending"


class SyncStatus(BaseModel):
    configured: bool
    spreadsheetId: Optional[str] = None
    lastSuccessfulBackup: Optional[str] = None
    lastAttemptedBackup: Optional[str] = None
    backupStatus: str
    pendingChanges: int = 0
    lastError: Optional[str] = None
    localCount: int = 0
    backupCount: Optional[int] = None
