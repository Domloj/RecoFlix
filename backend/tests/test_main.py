import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

with patch("firebase_admin.credentials.Certificate"), \
     patch("firebase_admin.initialize_app"):
    from main import app, get_current_user

client = TestClient(app)

def test_get_status_no_token():
    """
    Test 1: Użytkownik nie podaje żadnego tokenu w nagłówku.
    """
    response = client.get("/api/engine-status")
    
    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}


@patch("dependencies.auth.verify_id_token")
def test_get_status_invalid_token(mock_verify_token):
    """
    Test 2: Użytkownik podaje zły/wygasły token.
    """
    # Ustawiamy mocka tak, aby zasymulował błąd rzucany przez Firebase
    mock_verify_token.side_effect = Exception("Firebase error: expired token")
    
    # Symulujemy wysłanie nagłówka Authorization z wymyślonym tokenem
    response = client.get(
        "/api/engine-status", 
        headers={"Authorization": "Bearer wymyslony_zly_token"}
    )
    
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or expired Firebase token"}


def test_get_status_success():
    """
    Test 3: Prawidłowe logowanie.
    """
    def override_get_current_user():
        return {"uid": "testowy_uzytkownik_999"}

    app.dependency_overrides[get_current_user] = override_get_current_user

    response = client.get("/api/engine-status")

    assert response.status_code == 200
    assert response.json() == {
        "status": "online",
        "engine": "RecoFlix-XAI-v1",
        "database": "MovieLens-100k",
        "user_uid": "testowy_uzytkownik_999"
    }

    app.dependency_overrides = {}