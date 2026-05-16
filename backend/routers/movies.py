from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from dependencies import get_current_user
from services.movies_service import movies_service

router = APIRouter(prefix="/api/movies", tags=["Movies"])

class MovieListItem(BaseModel):
    id: int
    title: str
    release_year: str
    description: str
    poster_url: str


class MoviesPageResponse(BaseModel):
    items: list[MovieListItem]
    page: int
    page_size: int
    total: int


@router.get("/", response_model=MoviesPageResponse)
async def list_movies(
    user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    query: str | None = Query(None, min_length=1, max_length=100),
):
    return movies_service.list_movies(page=page, page_size=page_size, query=query)
