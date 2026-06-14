'''
Testy pokrywają:
- Poprawność struktury odpowiedzi z endpointu rekomendacji.
- Weryfikację że procentowe wkłady XAI sumują się do 100%.
- Obsługę przypadku gdy film nie jest znaleziony (404).
- Odporność na złośliwy input (ReDoS).
- Poprawne przekazywanie parametru alpha do silnika rekomendacji.
- Wymaganie autoryzacji do uzyskania rekomendacji.
'''


from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient


def _make_client(recommender_mock):
    with patch("firebase_admin.credentials.Certificate"), patch("firebase_admin.initialize_app"):
        from index import app
        from dependencies import get_current_user

    app.dependency_overrides[get_current_user] = lambda: {"uid": "user-1"}

    with patch("routers.recommendations.recommender", recommender_mock):
        yield TestClient(app)

    app.dependency_overrides = {}


SAMPLE_RESULT = [
    {
        "movie_id": 2,
        "title": "Jumanji (1995)",
        "poster_url": "https://image.tmdb.org/t/p/w500/poster.jpg",
        "score": 0.87,
        "xai": {
            "content_contribution_pct": 65.0,
            "collaborative_contribution_pct": 35.0,
            "human_explanation": "Film polecany głównie dlatego, że idealnie pokrywa się z klimatem.",
        },
    }
]


@pytest.fixture()
def ready_recommender():
    mock = MagicMock()
    mock.is_ready = True
    mock.get_recommendations.return_value = SAMPLE_RESULT
    return mock


@pytest.fixture()
def not_found_recommender():
    mock = MagicMock()
    mock.is_ready = True
    mock.get_recommendations.return_value = None
    return mock


def test_get_recommendations_returns_valid_structure(ready_recommender):
    with patch("firebase_admin.credentials.Certificate"), patch("firebase_admin.initialize_app"):
        from index import app
        from dependencies import get_current_user

    app.dependency_overrides[get_current_user] = lambda: {"uid": "user-1"}

    with patch("routers.recommendations.recommender", ready_recommender):
        client = TestClient(app)
        response = client.get("/api/recommendations/", params={"target_movie": "Toy Story"})

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1

    item = data[0]
    assert item["movie_id"] == 2
    assert item["title"] == "Jumanji (1995)"
    assert "poster_url" in item
    assert "score" in item

    xai = item["xai"]
    assert "content_contribution_pct" in xai
    assert "collaborative_contribution_pct" in xai
    assert "human_explanation" in xai

    app.dependency_overrides = {}


def test_get_recommendations_xai_percentages_sum_to_100(ready_recommender):
    with patch("firebase_admin.credentials.Certificate"), patch("firebase_admin.initialize_app"):
        from index import app
        from dependencies import get_current_user

    app.dependency_overrides[get_current_user] = lambda: {"uid": "user-1"}

    with patch("routers.recommendations.recommender", ready_recommender):
        client = TestClient(app)
        response = client.get("/api/recommendations/", params={"target_movie": "Toy Story"})

    xai = response.json()[0]["xai"]
    total = xai["content_contribution_pct"] + xai["collaborative_contribution_pct"]
    assert abs(total - 100.0) < 0.01

    app.dependency_overrides = {}


def test_get_recommendations_returns_404_for_unknown_movie(not_found_recommender):
    with patch("firebase_admin.credentials.Certificate"), patch("firebase_admin.initialize_app"):
        from index import app
        from dependencies import get_current_user

    app.dependency_overrides[get_current_user] = lambda: {"uid": "user-1"}

    with patch("routers.recommendations.recommender", not_found_recommender):
        client = TestClient(app)
        response = client.get("/api/recommendations/", params={"target_movie": "NIEISTNIEJĄCY FILM XYZ"})

    assert response.status_code == 404
    assert "nie został znaleziony" in response.json()["detail"]

    app.dependency_overrides = {}


def test_get_recommendations_handles_malicious_regex_input(ready_recommender):
    """Weryfikuje że złośliwy input (ReDoS) nie powoduje błędu 500."""
    with patch("firebase_admin.credentials.Certificate"), patch("firebase_admin.initialize_app"):
        from index import app
        from dependencies import get_current_user

    app.dependency_overrides[get_current_user] = lambda: {"uid": "user-1"}

    with patch("routers.recommendations.recommender", ready_recommender):
        client = TestClient(app)
        response = client.get(
            "/api/recommendations/",
            params={"target_movie": "((((((((((((((((((((a+)+)+)+)+)+)+)+"}
        )

    assert response.status_code != 500

    app.dependency_overrides = {}


def test_get_recommendations_passes_alpha_to_engine(ready_recommender):
    with patch("firebase_admin.credentials.Certificate"), patch("firebase_admin.initialize_app"):
        from index import app
        from dependencies import get_current_user

    app.dependency_overrides[get_current_user] = lambda: {"uid": "user-1"}

    with patch("routers.recommendations.recommender", ready_recommender):
        client = TestClient(app)
        client.get("/api/recommendations/", params={"target_movie": "Toy Story", "alpha": 0.8})

    ready_recommender.get_recommendations.assert_called_once_with("Toy Story", alpha=0.8, top_n=6)

    app.dependency_overrides = {}


def test_get_recommendations_requires_auth():
    with patch("firebase_admin.credentials.Certificate"), patch("firebase_admin.initialize_app"):
        from index import app

    app.dependency_overrides = {}

    client = TestClient(app, raise_server_exceptions=False)
    response = client.get("/api/recommendations/", params={"target_movie": "Toy Story"})

    assert response.status_code == 401