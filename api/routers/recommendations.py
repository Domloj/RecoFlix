from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.recommender_engine import recommender
from dependencies import get_current_user

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
    results = recommender.get_recommendations(target_movie, alpha=alpha, top_n=6)
    
    if results is None:
        raise HTTPException(status_code=404, detail=f"Film o tytule zawierającym '{target_movie}' nie został znaleziony w bazie.")
        
    return results

@router.post("/for-user", response_model=list[MovieRecommendation])
async def get_recommendations_for_user(
    liked_movie_ids: list[int],
    alpha: float = 0.5,
    user: dict = Depends(get_current_user)
):
    results = recommender.get_recommendations_for_user(liked_movie_ids, alpha=alpha, top_n=10)
    if results is None:
        raise HTTPException(status_code=404, detail="Brak wystarczających danych do rekomendacji.")
    return results