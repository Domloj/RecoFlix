import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from firebase_admin import auth
from fastapi.security import HTTPBearer

logger = logging.getLogger("recoflix_api")

security = HTTPBearer() 

async def get_current_user(res: HTTPAuthorizationCredentials = Depends(security)):
    try:
        decoded_token = auth.verify_id_token(res.credentials)
        return decoded_token
    except Exception as e:
        logger.warning(f"Odrzucono żądanie: nieprawidłowy lub wygasły token Firebase ({e})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
        )