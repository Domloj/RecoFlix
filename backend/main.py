from contextlib import asynccontextmanager
from dependencies import get_current_user
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
from routers import chat, recommendations, movies
from routers import admin
from services.recommender_engine import recommender
import os
from dotenv import load_dotenv
from constants import FRONTEND_URL_DEFAULT, SERVICE_ACCOUNT_PATH

load_dotenv()
frontend_url = os.getenv("FRONTEND_URL", FRONTEND_URL_DEFAULT)

@asynccontextmanager
async def lifespan(app: FastAPI):
    recommender.initialize()
    yield

app = FastAPI(lifespan=lifespan)

cred = credentials.Certificate(str(SERVICE_ACCOUNT_PATH))
firebase_admin.initialize_app(cred)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(recommendations.router)
app.include_router(movies.router)
app.include_router(admin.router)

@app.get("/api/engine-status")
async def get_status(user: dict = Depends(get_current_user)):
    return {
        "status": "online",
        "engine": "RecoFlix-XAI-v1",
        "database": "MovieLens-100k",
        "user_uid": user["uid"]
    }
    