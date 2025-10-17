# C:\MuggsOfDataSci\api\app.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Manners Ma’am API")

class PromptRequest(BaseModel):
    prompt: str

@app.get("/api/health")
async def health():
    return {"ok": True, "model": "demo"}

@app.post("/api/etiquette/analyze")
async def analyze(req: PromptRequest):
    """Temporary stub: echoes the prompt back."""
    return {
        "score": 4,
        "feedback": f"Gentle Prompter, your prompt was: {req.prompt[:120]}...",
        "checks": {
            "identity_assigned": True,
            "user_role_stated": True,
            "task_specific": True,
            "proper_harness": True,
        },
        "tokens": 42,
        "duration_ms": 1000
    }
