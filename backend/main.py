from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials

app = FastAPI()
security = HTTPBearer()

cred = credentials.Certificate("./serviceAccountKey.json")
firebase_admin.initialize_app(cred)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(res: HTTPAuthorizationCredentials = Depends(security)):
    try:
        decoded_token = auth.verify_id_token(res.credentials)
        return decoded_token
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
        )

@app.get("/api/engine-status")
async def get_status(user: dict = Depends(get_current_user)):
    return {
        "status": "online",
        "engine": "RecoFlix-XAI-v1",
        "database": "MovieLens-100k",
        "user_uid": user["uid"]
    }
    