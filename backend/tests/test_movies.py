import asyncio
import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


def _write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def _build_test_files(tmp_path: Path) -> dict[str, Path]:
    movies_db_path = tmp_path / "movies_database.json"
    links_csv_path = tmp_path / "links.csv"
    tags_csv_path = tmp_path / "tags.csv"
    cache_path = tmp_path / "tmdb_cache.json"

    _write_text(
        movies_db_path,
        json.dumps(
            [
                {
                    "id": 1,
                    "title": "Space Adventure",
                    "release_year": "1999",
                    "genres": ["Sci-Fi", "Adventure"],
                },
                {
                    "id": 2,
                    "title": "Quiet Drama",
                    "release_year": "2005",
                    "genres": ["Drama"],
                },
            ]
        ),
    )
    _write_text(links_csv_path, "movieId,tmdbId\n1,101\n")
    _write_text(tags_csv_path, "movieId,tag\n1,space\n1,funny\n2,slow\n")
    _write_text(cache_path, "{}")

    return {
        "movies": movies_db_path,
        "links": links_csv_path,
        "tags": tags_csv_path,
        "cache": cache_path,
    }


def _make_service(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    import services.movies_service as ms

    paths = _build_test_files(tmp_path)
    monkeypatch.setattr(ms, "MOVIES_DB_PATH", paths["movies"])
    monkeypatch.setattr(ms, "LINKS_CSV_PATH", paths["links"])
    monkeypatch.setattr(ms, "TAGS_CSV_PATH", paths["tags"])
    monkeypatch.setattr(ms, "TMDB_CACHE_PATH", paths["cache"])

    return ms.MoviesService(), ms


def test_list_movies_filters_paginates_and_enriches(monkeypatch, tmp_path):
    service, ms = _make_service(monkeypatch, tmp_path)

    service.tmdb_client.fetch_details = AsyncMock(
        return_value=ms.TmdbDetails(
            poster_url="https://img.test/poster.jpg",
            overview="A space story.",
        )
    )

    result = asyncio.run(service.list_movies(page=1, page_size=1, query="space"))

    assert result["total"] == 1
    assert result["page"] == 1
    assert result["page_size"] == 1
    assert len(result["items"]) == 1

    item = result["items"][0]
    assert item["id"] == 1
    assert item["poster_url"] == "https://img.test/poster.jpg"
    assert "A space story." in item["description"]
    assert "Gatunki:" in item["description"]

    service.tmdb_client.fetch_details.assert_awaited_once()


def test_list_movies_uses_cache_and_fallbacks(monkeypatch, tmp_path):
    import services.movies_service as ms

    language = ms.TMDB_LANGUAGE_DEFAULT
    monkeypatch.setenv("TMDB_LANGUAGE", language)

    paths = _build_test_files(tmp_path)
    cached = {
        f"101:{language}": {
            "poster_url": "https://img.test/cached.jpg",
            "overview": None,
        }
    }
    _write_text(paths["cache"], json.dumps(cached))

    monkeypatch.setattr(ms, "MOVIES_DB_PATH", paths["movies"])
    monkeypatch.setattr(ms, "LINKS_CSV_PATH", paths["links"])
    monkeypatch.setattr(ms, "TAGS_CSV_PATH", paths["tags"])
    monkeypatch.setattr(ms, "TMDB_CACHE_PATH", paths["cache"])

    service = ms.MoviesService()
    service.tmdb_client.fetch_details = AsyncMock(return_value=None)

    result = asyncio.run(service.list_movies(page=1, page_size=2, query=None))

    first = result["items"][0]
    second = result["items"][1]

    assert first["poster_url"] == "https://img.test/cached.jpg"
    assert "Popularne tagi" in first["description"]
    assert second["poster_url"] == ms.DEFAULT_POSTER_URL

    service.tmdb_client.fetch_details.assert_not_awaited()


def test_movies_route_calls_service():
    with patch("firebase_admin.credentials.Certificate"), patch(
        "firebase_admin.initialize_app"
    ):
        from main import app
        from dependencies import get_current_user

    sample_payload = {
        "items": [],
        "page": 2,
        "page_size": 5,
        "total": 0,
    }

    async def _fake_list_movies(**kwargs):
        return sample_payload

    app.dependency_overrides[get_current_user] = lambda: {"uid": "user-1"}

    with patch("routers.movies.movies_service.list_movies", new=AsyncMock()) as mock_list:
        mock_list.side_effect = _fake_list_movies
        client = TestClient(app)
        response = client.get(
            "/api/movies",
            params={"page": 2, "page_size": 5, "query": "space"},
        )

    assert response.status_code == 200
    assert response.json() == sample_payload
    assert mock_list.await_count == 1
    assert mock_list.await_args.kwargs == {"page": 2, "page_size": 5, "query": "space"}

    app.dependency_overrides = {}
