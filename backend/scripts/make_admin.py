from __future__ import annotations

import argparse
import sys
from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials, firestore


def _bootstrap_firebase() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    service_account_path = backend_dir / "serviceAccountKey.json"

    if not service_account_path.exists():
        raise FileNotFoundError(f"Brak pliku serviceAccountKey.json: {service_account_path}")

    if not firebase_admin._apps:
        cred = credentials.Certificate(str(service_account_path))
        firebase_admin.initialize_app(cred)


def make_admin(user_uid: str) -> None:
    _bootstrap_firebase()

    firestore_client = firestore.client()
    user_ref = firestore_client.collection("users").document(user_uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise ValueError(f"Nie znaleziono użytkownika w Firestore: {user_uid}")

    user_ref.update({"role": "admin"})
    auth.set_custom_user_claims(user_uid, {"admin": True})


def main() -> int:
    parser = argparse.ArgumentParser(description="Promote a Firebase user to admin")
    parser.add_argument("uid", help="Firebase Auth UID użytkownika")
    args = parser.parse_args()

    try:
        make_admin(args.uid)
        print(f"Użytkownik {args.uid} został promowany do admina.")
        return 0
    except Exception as exc:
        print(f"Błąd: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())