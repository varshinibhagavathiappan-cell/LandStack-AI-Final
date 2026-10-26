"""Gemini REST client. Keeps the API key server-side and returns transparent fallbacks."""
from __future__ import annotations
import os, requests
from typing import Any, Dict, List

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.base = "https://generativelanguage.googleapis.com/v1beta/models"

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def generate(self, prompt: str, temperature: float = 0.2) -> Dict[str, Any]:
        if not self.configured:
            return {"ok": False, "available": False, "error": "GEMINI_API_KEY is not configured."}
        url = f"{self.base}/{self.model}:generateContent"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": 1200},
        }
        try:
            r = requests.post(url, params={"key": self.api_key}, json=payload, timeout=30)
            if not r.ok:
                return {"ok": False, "available": True, "error": f"Gemini HTTP {r.status_code}", "detail": r.text[:500]}
            data = r.json()
            text = ""
            for candidate in data.get("candidates", []):
                for part in candidate.get("content", {}).get("parts", []):
                    if isinstance(part, dict) and part.get("text"):
                        text += part["text"]
            return {"ok": bool(text), "available": True, "text": text.strip(), "raw": data}
        except Exception as exc:
            return {"ok": False, "available": True, "error": str(exc)}

gemini_service = GeminiService()
