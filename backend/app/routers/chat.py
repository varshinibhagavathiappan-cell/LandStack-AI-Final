from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.app.agents.orchestrator import orchestrator

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en"
    case_id: Optional[str] = None

class AdaptiveQuestionRequest(BaseModel):
    question_id: str
    answer: str
    language: Optional[str] = "en"

@router.post("/answer-question")
def answer_question(req: AdaptiveQuestionRequest) -> Dict[str, Any]:
    return orchestrator.answer_adaptive_question(req.question_id, req.answer, req.language or "en")

@router.post("")
def chat_with_landstack(req: ChatRequest) -> Dict[str, Any]:
    """
    Conversational Problem Understanding endpoint.
    Citizen enters plain problem in Tamil, English, or Telugu.
    Case Agent detects intent, RAG retrieves trusted sources, and updates case state.
    """
    if not req.message.strip():
        return {
            "reply": "Please provide your land-related problem or question.",
            "citations": []
        }

    return orchestrator.process_chat_message(req.message, req.language or "ta")
