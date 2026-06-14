# API connector package

This directory contains the shared API connector layer used to link the frontend and backend.

It currently exposes serializer code and can be extended with shared request/response contract logic, API adapters, or gateway utilities.

## Contents

- `serializers.py` — shared Django REST Framework serializers for frontend-facing data.
- `__init__.py` — package entrypoint.

## Intent

The backend implementation remains in `backend/`, while `api/` holds the shared API contract used by both sides.
