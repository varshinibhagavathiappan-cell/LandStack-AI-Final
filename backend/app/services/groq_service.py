"""Groq REST client for LandStack AI. API key stays server-side.
Uses Groq OpenAI-compatible Chat Completions without adding another SDK dependency.
"""
from __future__ import annotations
import os
from typing import Any, Dict, List
import requests

class GroqService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b").strip()
        self.base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def generate(self, messages: List[Dict[str, str]], temperature: float = 0.2) -> Dict[str, Any]:
        if not self.configured:
            return {"ok": False, "available": False, "error": "GROQ_API_KEY is not configured."}
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": max(0.01, min(float(temperature), 2.0)),
            "max_tokens": 1200,
        }
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=45,
            )
            if not response.ok:
                return {
                    "ok": False,
                    "available": True,
                    "error": f"Groq HTTP {response.status_code}",
                    "detail": response.text[:500],
                }
            data = response.json()
            choices = data.get("choices") or []
            text = ""
            if choices:
                text = ((choices[0].get("message") or {}).get("content") or "").strip()
            return {
                "ok": bool(text),
                "available": True,
                "text": text,
                "model": data.get("model", self.model),
                "raw": data,
            }
        except Exception as exc:
            return {"ok": False, "available": True, "error": str(exc)}

groq_service = GroqService()
