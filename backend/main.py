from dependencies import get_current_user
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
from routers import chat
import os
from dotenv import load_dotenv

load_dotenv()
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI()

cred = credentials.Certificate("./serviceAccountKey.json")
firebase_admin.initialize_app(cred)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)

@app.get("/api/engine-status")
async def get_status(user: dict = Depends(get_current_user)):
    return {
        "status": "online",
        "engine": "RecoFlix-XAI-v1",
        "database": "MovieLens-100k",
        "user_uid": user["uid"]
    }
    