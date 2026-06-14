from services.llm_service import generate_movie_recommendation
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from dependencies import get_current_user

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str
    history: list[str] = []

@router.post("/")
async def chat_with_ai(request: ChatRequest, user: dict = Depends(get_current_user)):
    ai_response = await generate_movie_recommendation(
        user_prompt=request.message,
        user_history=request.history
    )
    
    return {"response": ai_response}