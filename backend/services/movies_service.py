import asyncio
import csv
import json
import logging
import os
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from constants import (
    DEFAULT_POSTER_URL,
    LINKS_CSV_PATH,
    MOVIES_DB_PATH,
    TAGS_CSV_PATH,
    TMDB_BASE_URL,
    TMDB_CACHE_PATH,
    TMDB_IMAGE_BASE_URL,
    TMDB_LANGUAGE_DEFAULT,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class TmdbDetails:
    poster_url: str | None
    overview: str | None


class TmdbClient:
    def __init__(self, api_key: str | None, language: str | None) -> None:
        self.api_key = api_key
        self.language = language

    async def fetch_details(
        self, client: httpx.AsyncClient, tmdb_id: int, language: str | None
    ) -> TmdbDetails | None:
        if not self.api_key:
            return None

        url = f"{TMDB_BASE_URL}/{tmdb_id}"
        try:
            params: dict[str, str] = {"api_key": self.api_key}
            if language:
                params["language"] = language
                
            response = await client.get(url, params=params, timeout=4.0)
            if response.status_code != 200:
                return None

            data = response.json()
            poster_path = data.get("poster_path")
            overview = data.get("overview")
            poster_url = (
                f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else None
            )
            return TmdbDetails(poster_url=poster_url, overview=overview)
        except httpx.RequestError as exc:
            logger.warning("TMDB request failed for %s: %s", tmdb_id, exc)
            return None


class TmdbCache:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.data: dict[str, dict[str, str | None]] = {}
        self.is_dirty = False
        self._load()

    def _load(self) -> None:
        if not self.path.exists():
            return

        try:
            with self.path.open("r", encoding="utf-8") as file:
                raw = json.load(file)
                if isinstance(raw, dict):
                    self.data = raw
        except (OSError, json.JSONDecodeError) as exc:
            logger.warning("Failed to load TMDB cache: %s", exc)

    def get(self, tmdb_id: int, language: str | None) -> TmdbDetails | None:
        cache_key = self._build_key(tmdb_id, language)
        entry = self.data.get(cache_key)
        if not entry:
            return None
        return TmdbDetails(
            poster_url=entry.get("poster_url"),
            overview=entry.get("overview"),
        )

    def set(self, tmdb_id: int, language: str | None, details: TmdbDetails) -> None:
        cache_key = self._build_key(tmdb_id, language)
        self.data[cache_key] = {
            "poster_url": details.poster_url,
            "overview": details.overview,
        }
        self.is_dirty = True

    @staticmethod
    def _build_key(tmdb_id: int, language: str | None) -> str:
        return f"{tmdb_id}:{language or 'default'}"

    def save(self) -> None:
        if not self.is_dirty:
            return
        try:
            with self.path.open("w", encoding="utf-8") as file:
                json.dump(self.data, file, ensure_ascii=False)
            self.is_dirty = False
        except OSError as exc:
            logger.warning("Failed to save TMDB cache: %s", exc)


class MoviesService:
    def __init__(self) -> None:
        tmdb_language = os.getenv("TMDB_LANGUAGE", TMDB_LANGUAGE_DEFAULT)
        self.tmdb_language = tmdb_language.strip() if tmdb_language else None
        self.tmdb_client = TmdbClient(os.getenv("TMDB_API_KEY"), self.tmdb_language)
        self.tmdb_cache = TmdbCache(TMDB_CACHE_PATH)
        
        # Load static files on initialization
        self.movies = self._load_movies_db()
        self.tmdb_links = self._load_tmdb_links()
        self.movie_tags = self._load_tags()

    async def list_movies(
        self, page: int = 1, page_size: int = 50, query: str | None = None
    ) -> dict[str, Any]:
        page = max(page, 1)
        page_size = max(1, min(page_size, 200))
        filtered_movies = self._filter_movies(query)
        total = len(filtered_movies)
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        page_movies = filtered_movies[start_index:end_index]

        tmdb_details_map: dict[int, TmdbDetails] = {}

        # Używamy httpx.AsyncClient do współbieżnego pobrania wszystkich brakujących plakatów
        async with httpx.AsyncClient() as client:
            tasks = []
            for movie in page_movies:
                movie_id = int(movie.get("id", 0))
                tmdb_id = self.tmdb_links.get(movie_id)
                if tmdb_id:
                    tasks.append(self._fetch_tmdb_for_movie(client, movie_id, tmdb_id))

            if tasks:
                fetched_results = await asyncio.gather(*tasks)
                for m_id, details in fetched_results:
                    if details:
                        tmdb_details_map[m_id] = details

        results: list[dict[str, Any]] = []

        for movie in page_movies:
            movie_id = int(movie.get("id", 0))
            title = str(movie.get("title", ""))
            release_year = str(movie.get("release_year", ""))
            genres = movie.get("genres") or []

            tmdb_details = tmdb_details_map.get(movie_id)
            poster_url = (
                tmdb_details.poster_url if tmdb_details and tmdb_details.poster_url else DEFAULT_POSTER_URL
            )

            tag_summary = self._build_tag_summary(movie_id)
            description = self._build_description(
                tmdb_details.overview if tmdb_details else None,
                tag_summary,
                genres,
            )

            results.append(
                {
                    "id": movie_id,
                    "title": title,
                    "release_year": release_year,
                    "description": description,
                    "poster_url": poster_url,
                }
            )

        self.tmdb_cache.save()

        return {
            "items": results,
            "page": page,
            "page_size": page_size,
            "total": total,
        }

    async def _fetch_tmdb_for_movie(
        self, client: httpx.AsyncClient, movie_id: int, tmdb_id: int
    ) -> tuple[int, TmdbDetails | None]:
        """Helper do asynchronicznego pobierania i mapowania na movie_id."""
        cached = self.tmdb_cache.get(tmdb_id, self.tmdb_language)
        if cached:
            return movie_id, cached

        fresh = await self.tmdb_client.fetch_details(client, tmdb_id, self.tmdb_language)
        if fresh:
            self.tmdb_cache.set(tmdb_id, self.tmdb_language, fresh)
        return movie_id, fresh

    def _load_movies_db(self) -> list[dict[str, Any]]:
        with MOVIES_DB_PATH.open("r", encoding="utf-8") as file:
            return json.load(file)

    def _filter_movies(self, query: str | None) -> list[dict[str, Any]]:
        if not query:
            return self.movies
        normalized_query = query.strip().lower()
        if not normalized_query:
            return self.movies
        return [
            movie
            for movie in self.movies
            if normalized_query in str(movie.get("title", "")).lower()
        ]

    def _load_tmdb_links(self) -> dict[int, int]:
        if not LINKS_CSV_PATH.exists():
            return {}

        tmdb_links: dict[int, int] = {}
        with LINKS_CSV_PATH.open("r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                movie_id = int(row.get("movieId") or 0)
                tmdb_id = row.get("tmdbId")
                if movie_id and tmdb_id:
                    try:
                        tmdb_links[movie_id] = int(float(tmdb_id))
                    except ValueError:
                        continue
        return tmdb_links

    def _load_tags(self) -> dict[int, Counter[str]]:
        if not TAGS_CSV_PATH.exists():
            return {}

        tags_map: dict[int, Counter[str]] = defaultdict(Counter)
        with TAGS_CSV_PATH.open("r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                movie_id = int(row.get("movieId") or 0)
                tag = (row.get("tag") or "").strip()
                if movie_id and tag:
                    tags_map[movie_id][tag] += 1

        return tags_map

    def _build_tag_summary(self, movie_id: int) -> list[str]:
        tags_counter = self.movie_tags.get(movie_id)
        if not tags_counter:
            return []
        return [tag for tag, _ in tags_counter.most_common(5)]

    def _build_description(
        self,
        overview: str | None,
        tags: list[str],
        genres: list[str],
    ) -> str:
        parts: list[str] = []

        if overview:
            parts.append(overview.strip())
        elif tags:
            parts.append(f"Popularne tagi: {', '.join(tags)}.")

        if genres:
            parts.append(f"Gatunki: {', '.join(genres)}.")

        if not parts:
            return "Brak opisu."

        return "\n".join(parts)


movies_service = MoviesService()