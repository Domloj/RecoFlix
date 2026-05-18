from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from firebase_admin import firestore

from dependencies import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class AdminUserItem(BaseModel):
    uid: str
    username: str = ""
    email: str = ""
    role: str = Field(pattern="^(user|admin)$")
    createdAt: str | None = None
    profilePicture: str | None = None


class AdminUpdateUserRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    role: str = Field(pattern="^(user|admin)$")


def _get_firestore_client():
    return firestore.client()


def _require_admin(user: dict) -> None:
    user_doc = _get_firestore_client().collection("users").document(user["uid"]).get()
    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    user_data = user_doc.to_dict() or {}
    if user_data.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


@router.get("/users", response_model=list[AdminUserItem])
async def list_users(user: dict = Depends(get_current_user)):
    _require_admin(user)

    records: list[AdminUserItem] = []
    firestore_client = _get_firestore_client()
    users_snapshot = firestore_client.collection("users").stream()

    for document_snapshot in users_snapshot:
        data = document_snapshot.to_dict() or {}
        records.append(
            AdminUserItem(
                uid=document_snapshot.id,
                username=str(data.get("username", "")),
                email=str(data.get("email", "")),
                role="admin" if data.get("role") == "admin" else "user",
                createdAt=data.get("createdAt") if isinstance(data.get("createdAt"), str) else None,
                profilePicture=data.get("profilePicture") if isinstance(data.get("profilePicture"), str) else None,
            )
        )

    return records


@router.patch("/users/{user_id}", response_model=AdminUserItem)
async def update_user(user_id: str, payload: AdminUpdateUserRequest, user: dict = Depends(get_current_user)):
    _require_admin(user)

    firestore_client = _get_firestore_client()
    user_ref = firestore_client.collection("users").document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = user_doc.to_dict() or {}
    user_ref.update(
        {
            "username": payload.username,
            "role": payload.role,
        }
    )

    updated = {**existing, "username": payload.username, "role": payload.role}
    return AdminUserItem(
        uid=user_id,
        username=str(updated.get("username", "")),
        email=str(updated.get("email", "")),
        role="admin" if updated.get("role") == "admin" else "user",
        createdAt=updated.get("createdAt") if isinstance(updated.get("createdAt"), str) else None,
        profilePicture=updated.get("profilePicture") if isinstance(updated.get("profilePicture"), str) else None,
    )