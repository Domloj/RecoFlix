from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient


class _FakeDocumentSnapshot:
    def __init__(self, document_id: str, data: dict[str, object], exists: bool = True) -> None:
        self.id = document_id
        self._data = data
        self.exists = exists

    def to_dict(self) -> dict[str, object]:
        return self._data


class _FakeDocumentRef:
    def __init__(self, document_id: str, data: dict[str, object], store: dict[str, dict[str, object]]) -> None:
        self.document_id = document_id
        self._data = data
        self._store = store

    def get(self) -> _FakeDocumentSnapshot:
        return _FakeDocumentSnapshot(self.document_id, self._store[self.document_id])

    def update(self, payload: dict[str, object]) -> None:
        self._store[self.document_id].update(payload)


class _FakeUsersCollection:
    def __init__(self, store: dict[str, dict[str, object]]) -> None:
        self._store = store

    def document(self, document_id: str) -> _FakeDocumentRef:
        return _FakeDocumentRef(document_id, self._store[document_id], self._store)

    def stream(self):
        for document_id, data in self._store.items():
            yield _FakeDocumentSnapshot(document_id, data)


class _FakeFirestoreClient:
    def __init__(self, store: dict[str, dict[str, object]]) -> None:
        self._store = store

    def collection(self, collection_name: str) -> _FakeUsersCollection:
        assert collection_name == 'users'
        return _FakeUsersCollection(self._store)


def _build_app():
    with patch('firebase_admin.credentials.Certificate'), patch('firebase_admin.initialize_app'):
        from main import app
        from dependencies import get_current_user

    return app, get_current_user


def test_admin_users_list_requires_admin_and_returns_records():
    app, get_current_user = _build_app()
    users_store = {
        'admin-uid': {
            'username': 'Admin',
            'email': 'admin@example.com',
            'role': 'admin',
            'createdAt': '2026-05-01T00:00:00.000Z',
        },
        'user-uid': {
            'username': 'User',
            'email': 'user@example.com',
            'role': 'user',
            'createdAt': '2026-05-02T00:00:00.000Z',
        },
    }

    app.dependency_overrides[get_current_user] = lambda: {'uid': 'admin-uid'}

    with patch('routers.admin.firestore.client', return_value=_FakeFirestoreClient(users_store)):
        client = TestClient(app)
        response = client.get('/api/admin/users')

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 2
    assert payload[0]['uid'] == 'admin-uid'
    assert payload[0]['role'] == 'admin'
    assert payload[1]['uid'] == 'user-uid'

    app.dependency_overrides = {}


def test_admin_users_list_blocks_non_admin():
    app, get_current_user = _build_app()
    users_store = {
        'user-uid': {
            'username': 'User',
            'email': 'user@example.com',
            'role': 'user',
            'createdAt': '2026-05-02T00:00:00.000Z',
        },
    }

    app.dependency_overrides[get_current_user] = lambda: {'uid': 'user-uid'}

    with patch('routers.admin.firestore.client', return_value=_FakeFirestoreClient(users_store)):
        client = TestClient(app)
        response = client.get('/api/admin/users')

    assert response.status_code == 403
    assert response.json() == {'detail': 'Admin access required'}

    app.dependency_overrides = {}


def test_admin_user_update_changes_username_and_role():
    app, get_current_user = _build_app()
    users_store = {
        'admin-uid': {
            'username': 'Admin',
            'email': 'admin@example.com',
            'role': 'admin',
            'createdAt': '2026-05-01T00:00:00.000Z',
        },
        'user-uid': {
            'username': 'User',
            'email': 'user@example.com',
            'role': 'user',
            'createdAt': '2026-05-02T00:00:00.000Z',
        },
    }

    app.dependency_overrides[get_current_user] = lambda: {'uid': 'admin-uid'}

    with patch('routers.admin.firestore.client', return_value=_FakeFirestoreClient(users_store)):
        client = TestClient(app)
        response = client.patch(
            '/api/admin/users/user-uid',
            json={'username': 'Updated User', 'role': 'admin'},
        )

    assert response.status_code == 200
    assert response.json()['username'] == 'Updated User'
    assert response.json()['role'] == 'admin'
    assert users_store['user-uid']['username'] == 'Updated User'
    assert users_store['user-uid']['role'] == 'admin'

    app.dependency_overrides = {}