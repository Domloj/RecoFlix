import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

import json
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
from routers import chat, recommendations, movies
from routers import admin
from services.recommender_engine import recommender
from dependencies import get_current_user
from dotenv import load_dotenv
from constants import FRONTEND_URL_DEFAULT, SERVICE_ACCOUNT_PATH
from logtail import LogtailHandler
import logging

load_dotenv()
frontend_url = os.getenv("FRONTEND_URL", FRONTEND_URL_DEFAULT)

try:
    recommender.initialize()
except FileNotFoundError:
    print("Uwaga: Brak pliku bazy filmów. Pomijam inicjalizację silnika (Środowisko testowe/CI).")

app = FastAPI()

logger = logging.getLogger("recoflix_api")
logger.setLevel(logging.INFO)

logtail_token = os.environ.get("LOGTAIL_TOKEN")

if logtail_token:
    handler = LogtailHandler(source_token=logtail_token)
    logger.addHandler(handler)
    logger.info("Aplikacja Recoflix API uruchomiona i podłączona do Better Stack!")
else:
    print("Brak tokenu LOGTAIL_TOKEN w .env!")

if not firebase_admin._apps:
    firebase_cert_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    
    if firebase_cert_json:
        cert_dict = json.loads(firebase_cert_json)
        cred = credentials.Certificate(cert_dict)
    else:
        from constants import SERVICE_ACCOUNT_PATH
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
    logger.info("Użytkownik wszedł na główny endpoint.")
    
    return {
        "status": "online",
        "engine": "RecoFlix-XAI-v1",
        "database": "MovieLens-100k",
        "user_uid": user["uid"]
    }