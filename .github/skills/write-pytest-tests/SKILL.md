# Write Pytest Tests Procedure

Use this skill for writing tests for FastAPI routers and services. The project uses `pytest`, `httpx`, and FastAPI's built-in `TestClient`.

## Prioritization Hierarchy & Overview

Explicitly label and organize the output into the following sections: imports/setup, fixtures, mocking, and test cases. When generating tests, follow this strict priority order:

1. **Structure:** Strict adherence to the AAA (Arrange, Act, Assert) pattern.
2. **Isolation:** External services and APIs must always be mocked — never call real endpoints in tests.
3. **Coverage:** Test the happy path, error cases (4xx/5xx), and edge cases (empty results, missing fields).
4. **Clarity:** Each test has a single responsibility and a descriptive name.

## Setup & Imports

- Import `pytest`, `TestClient` from `fastapi.testclient`, and `unittest.mock.patch` or `pytest-mock`'s `mocker`.
- Import the FastAPI `app` instance from `main`.
- Use `pytest.fixture` for shared setup — never repeat boilerplate across tests.
- **Import Validation:** If a path or symbol is uncertain, add `# TODO: verify import path` rather than guessing.

## Fixtures

- Define a `client` fixture that returns `TestClient(app)` — reuse it across all test functions.
- Define fixtures for common mock data (e.g., a `mock_movie` dict) to keep tests DRY.
- Use `autouse=True` sparingly — only for fixtures that truly apply to every test in a module.

## Mocking External Dependencies

- Never make real HTTP calls, file reads, or Firebase calls in tests.
- Mock services at the point of use with `unittest.mock.patch` or `mocker.patch`.
- Mock Firebase auth by patching `dependencies.get_current_user` to return a fake user dict.
- Reset mocks between tests — use `pytest`'s function scope (default) for fixtures.

## Test Cases — Step-by-Step

1. **Happy Path**
   - Mock dependencies to return valid data.
   - Call the endpoint via `client.get(...)` / `client.post(...)`.
   - Assert status code is `200` (or `201` for creation).
   - Assert response JSON matches the expected Pydantic model shape.

2. **Authentication / Authorization**
   - Test that endpoints without a valid token return `401` or `403`.
   - Use a fixture that patches `get_current_user` to simulate an authenticated user.

3. **Not Found / Empty Results**
   - Mock the service to return `None` or an empty list.
   - Assert the correct status code (`404`) or an empty `items` array.

4. **External API Failure**
   - Mock external calls (TMDB, OpenAI, Gemini) to raise exceptions.
   - Assert the endpoint returns a graceful error response, not a 500 traceback.

## Structure (AAA Pattern)

Follow these steps inside every test function:

1. **Arrange:** Configure mocks and prepare input data.
2. **Act:** Make the HTTP request via `TestClient`.
3. **Assert:** Check status code, response body, and mock call counts.

## Example Code Pattern

```python
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_user():
    return {"uid": "test-uid-123", "email": "test@recoflix.com"}

@pytest.fixture(autouse=True)
def mock_auth(mock_user):
    with patch("dependencies.get_current_user", return_value=mock_user):
        yield


class TestMoviesEndpoint:

    def test_list_movies_returns_paginated_results(self, client):
        # Arrange
        mock_response = {"items": [{"id": 1, "title": "Inception", "release_year": "2010", "description": "...", "poster_url": "http://..."}], "page": 1, "page_size": 50, "total": 1}

        with patch("routers.movies.movies_service.list_movies", return_value=mock_response) as mock_service:
            # Act
            response = client.get("/api/movies/")

            # Assert
            assert response.status_code == 200
            data = response.json()
            assert "items" in data
            assert data["page"] == 1
            mock_service.assert_called_once()

    def test_list_movies_returns_empty_list_when_no_results(self, client):
        # Arrange
        mock_response = {"items": [], "page": 1, "page_size": 50, "total": 0}

        with patch("routers.movies.movies_service.list_movies", return_value=mock_response):
            # Act
            response = client.get("/api/movies/?query=xyznonexistent")

            # Assert
            assert response.status_code == 200
            assert response.json()["items"] == []

    def test_list_movies_requires_authentication(self, client):
        # Arrange
        with patch("dependencies.get_current_user", side_effect=Exception("Unauthorized")):
            # Act
            response = client.get("/api/movies/")

            # Assert
            assert response.status_code in (401, 403, 500)
```

## Quick Checklist

- [ ] `client` fixture defined and reused
- [ ] `get_current_user` patched to avoid real Firebase calls
- [ ] All external services mocked — no real HTTP calls
- [ ] Happy path tested (200 + correct response shape)
- [ ] Error / edge cases tested (404, empty results, service failure)
- [ ] AAA pattern followed in every test function
