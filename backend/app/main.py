import os
from pathlib import Path
from dotenv import load_dotenv

# Load the backend secret file before importing services that read environment variables.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routers import (
    chat, cases, documents, evidence, recommendations, registry, tools, demo, intelligence
)
from backend.app.services.gemini_service import gemini_service
from backend.app.services.groq_service import groq_service

app = FastAPI(
    title="LandStack AI - Citizen Land Decision Copilot",
    description="Multilingual, problem-first Land Decision Copilot with RAG and Agentic AI Architecture.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all modular routers
app.include_router(chat.router)
app.include_router(cases.router)
app.include_router(documents.router)
app.include_router(evidence.router)
app.include_router(recommendations.router)
app.include_router(registry.router)
app.include_router(tools.router)
app.include_router(demo.router)
app.include_router(intelligence.router)

@app.get("/")
def root():
    return {
        "product": "LandStack AI",
        "positioning": "LandStack AI is a multilingual, problem-first Land Decision Copilot that helps citizens who may not even know which land service they need—understands their problem through conversation, creates a personalized workflow, explains and analyzes their documents, connects evidence, finds verification gaps, guides the next action, and tracks the case through completion.",
        "journey": "SPEAK → UNDERSTAND → IDENTIFY → PLAN → COLLECT → EXPLAIN → ANALYZE → VERIFY → ACT → TRACK → COMPLETE",
        "status": "OPERATIONAL",
        "demo_mode": False,
        "docs_url": "/docs",
        "ai": {"provider": "Groq" if groq_service.configured else ("Gemini" if gemini_service.configured else "Local fallback"), "configured": groq_service.configured or gemini_service.configured, "model": groq_service.model if groq_service.configured else gemini_service.model},
        "real_data_policy": "No fabricated land, ownership, death, court, bank, lawyer, survey or alert data."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
