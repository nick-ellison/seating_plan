import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_generate_seating_basic():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:

        payload = {
            "guests": [
                {
                    "id": "g1",
                    "name": "Nick",
                    "gender": "Male",
                    "maritalStatus": "Married to Charlotte",
                    "wantsToSitNextTo": ["g2"],
                    "mustNotSitNextTo": [],
                    "tags": ["VIP"],
                    "attributes": {"side": "groom"},
                },
                {
                    "id": "g2",
                    "name": "Charlotte",
                    "gender": "Female",
                    "maritalStatus": "Married to Nick",
                    "wantsToSitNextTo": ["g1"],
                    "mustNotSitNextTo": [],
                    "tags": [],
                    "attributes": {"side": "bride"},
                },
            ],
            "tables": [
                {
                    "id": "t1",
                    "name": "Top Table",
                    "shape": "round",
                    "capacity": 4,
                }
            ],
            "profile": "wedding_default",
            "maxAttempts": 200,
            "seed": 42,
        }

        resp = await ac.post("/api/seating/generate", json=payload)
        assert resp.status_code == 200

        data = resp.json()
        assert "tables" in data
        assert len(data["tables"]) == 1

        seats = data["tables"][0]["seats"]
        ids = {s["guestId"] for s in seats}

        assert ids == {"g1", "g2"}


@pytest.mark.asyncio
async def test_generate_seating_rejects_over_capacity():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "guests": [
                {"id": "g1", "name": "A", "gender": "Male"},
                {"id": "g2", "name": "B", "gender": "Female"},
                {"id": "g3", "name": "C", "gender": "Male"},
            ],
            "tables": [
                {
                    "id": "t1",
                    "name": "Small Table",
                    "shape": "round",
                    "capacity": 2,
                }
            ],
            "profile": "wedding_default",
            "maxAttempts": 10,
            "seed": 1,
        }

        resp = await ac.post("/api/seating/generate", json=payload)
        assert resp.status_code == 400
        assert "Not enough seats" in resp.json()["detail"]
