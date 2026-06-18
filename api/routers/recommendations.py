from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging
from services.recommender_engine import recommender
from dependencies import get_current_user

logger = logging.getLogger("recoflix_api")

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

# --- Definicja Kontraktu JSON ---
class XAIExplanation(BaseModel):
    content_contribution_pct: float
    collaborative_contribution_pct: float
    human_explanation: str

class MovieRecommendation(BaseModel):
    movie_id: int
    title: str
    poster_url: str
    score: float
    xai: XAIExplanation
# --------------------------------

@router.get("/", response_model=list[MovieRecommendation])
async def get_recommendations(target_movie: str, alpha: float = 0.5, user: dict = Depends(get_current_user)):
    """
    Pobiera rekomendacje i dane XAI dla podanego filmu bazowego.
    Przykład użycia: /api/recommendations/?target_movie=Toy Story&alpha=0.6
    """
    logger.info(f"Użytkownik {user.get('uid')} pobiera rekomendacje na podstawie filmu: '{target_movie}' (alpha: {alpha})")
    
    results = recommender.get_recommendations(target_movie, alpha=alpha, top_n=6)
    
    if results is None:
        logger.warning(f"Błąd pobierania rekomendacji: film '{target_movie}' nie został znaleziony w bazie (użytkownik {user.get('uid')})")
        raise HTTPException(status_code=404, detail=f"Film o tytule zawierającym '{target_movie}' nie został znaleziony w bazie.")
        
    return results

@router.post("/for-user", response_model=list[MovieRecommendation])
async def get_recommendations_for_user(
    liked_movie_ids: list[int],
    alpha: float = 0.5,
    user: dict = Depends(get_current_user)
):
    logger.info(f"Użytkownik {user.get('uid')} pobiera rekomendacje dla polubionych ID: {liked_movie_ids} (alpha: {alpha})")
    
    results = recommender.get_recommendations_for_user(liked_movie_ids, alpha=alpha, top_n=10)
    if results is None:
        logger.warning(f"Błąd rekomendacji dla użytkownika {user.get('uid')}: brak wystarczających danych z polubionych filmów.")
        raise HTTPException(status_code=404, detail="Brak wystarczających danych do rekomendacji.")
        
    return results