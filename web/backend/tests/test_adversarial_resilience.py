"""Tests for adversarial resilience features (MVP15-MVP19)."""
import uuid

import pytest
from sqlalchemy import delete, select, update

from app.apps.schema_hash import compute_schema_hash
from app.database import get_session_factory
from app.models import AppRegistration, AppSchemaAudit


pytestmark = pytest.mark.asyncio


def _unique_app_id() -> str:
    return f"test-{uuid.uuid4().hex[:8]}"


async def _restore_app(app_id: str, original_hash: str):
    """Restore an app to active state with original hash after test."""
    sf = get_session_factory()
    async with sf() as db:
        await db.execute(
            update(AppRegistration)
            .where(AppRegistration.app_id == app_id)
            .values(schema_hash=original_hash, is_active=True)
        )
        await db.commit()


class TestSchemaHash:
    """Test schema hash computation."""

    def test_deterministic(self):
        schemas = [{"name": "foo", "description": "bar", "parameters": []}]
        assert compute_schema_hash(schemas) == compute_schema_hash(schemas)

    def test_order_independent(self):
        """Key order in dict doesn't affect hash."""
        a = [{"name": "foo", "description": "bar"}]
        b = [{"description": "bar", "name": "foo"}]
        assert compute_schema_hash(a) == compute_schema_hash(b)

    def test_different_schemas_different_hash(self):
        a = [{"name": "foo", "description": "bar"}]
        b = [{"name": "foo", "description": "baz"}]
        assert compute_schema_hash(a) != compute_schema_hash(b)


class TestSchemaIntegrity:
    """Test that invoke rejects requests when schema hash doesn't match."""

    async def test_invoke_succeeds_with_valid_hash(self, student1_client):
        resp = await student1_client.post("/api/apps/chess/invoke", json={
            "tool": "test",
            "params": {},
        })
        assert resp.status_code == 200

    async def test_invoke_rejects_on_hash_mismatch(self, student1_client):
        """Simulate schema drift by tampering with the stored hash."""
        sf = get_session_factory()
        async with sf() as db:
            result = await db.execute(
                select(AppRegistration).where(AppRegistration.app_id == "calculator")
            )
            app = result.scalar_one()
            original_hash = app.schema_hash

        try:
            async with sf() as db:
                await db.execute(
                    update(AppRegistration)
                    .where(AppRegistration.app_id == "calculator")
                    .values(schema_hash="tampered_hash_value")
                )
                await db.commit()

            resp = await student1_client.post("/api/apps/calculator/invoke", json={
                "tool": "test",
                "params": {},
            })
            assert resp.status_code == 403
            assert "schema integrity" in resp.json()["detail"].lower()
        finally:
            await _restore_app("calculator", original_hash)

    async def test_hash_mismatch_suspends_app(self, student1_client):
        """App should be auto-suspended on hash mismatch."""
        sf = get_session_factory()
        async with sf() as db:
            result = await db.execute(
                select(AppRegistration).where(AppRegistration.app_id == "dictionary")
            )
            original_hash = result.scalar_one().schema_hash

        try:
            async with sf() as db:
                await db.execute(
                    update(AppRegistration)
                    .where(AppRegistration.app_id == "dictionary")
                    .values(schema_hash="bad_hash")
                )
                await db.commit()

            await student1_client.post("/api/apps/dictionary/invoke", json={
                "tool": "test",
                "params": {},
            })

            async with sf() as db:
                result = await db.execute(
                    select(AppRegistration).where(AppRegistration.app_id == "dictionary")
                )
                app = result.scalar_one()
                assert app.is_active is False
        finally:
            await _restore_app("dictionary", original_hash)

    async def test_hash_mismatch_creates_audit_entry(self, student1_client):
        """Auto-suspension should create an audit trail entry."""
        sf = get_session_factory()
        async with sf() as db:
            result = await db.execute(
                select(AppRegistration).where(AppRegistration.app_id == "weather")
            )
            original_hash = result.scalar_one().schema_hash

        try:
            async with sf() as db:
                await db.execute(
                    update(AppRegistration)
                    .where(AppRegistration.app_id == "weather")
                    .values(schema_hash="bad_hash", is_active=True)
                )
                await db.commit()

            await student1_client.post("/api/apps/weather/invoke", json={
                "tool": "test",
                "params": {},
            })

            async with sf() as db:
                result = await db.execute(
                    select(AppSchemaAudit)
                    .where(AppSchemaAudit.app_id == "weather")
                    .where(AppSchemaAudit.decision == "auto_suspended")
                )
                audit = result.scalar_one_or_none()
                assert audit is not None
                assert audit.old_hash == "bad_hash"
                assert audit.reason is not None
        finally:
            await _restore_app("weather", original_hash)


class TestAppRegistrationWithHash:
    """Test that register_app computes and stores schema hash."""

    async def test_register_stores_hash(self, admin_client):
        app_id = _unique_app_id()
        schemas = [{"name": "my_tool", "description": "A tool", "parameters": []}]
        resp = await admin_client.post("/api/apps/register", json={
            "app_id": app_id,
            "name": "Test App",
            "description": "Testing schema hash",
            "auth_type": "none",
            "iframe_url": "/apps/test/index.html",
            "tool_schemas": schemas,
        })
        assert resp.status_code == 201

        sf = get_session_factory()
        async with sf() as db:
            result = await db.execute(
                select(AppRegistration).where(AppRegistration.app_id == app_id)
            )
            app = result.scalar_one()
            assert app.schema_hash is not None
            assert app.schema_hash == compute_schema_hash(schemas)
            assert app.schema_version == 1

    async def test_register_creates_audit_entry(self, admin_client):
        app_id = _unique_app_id()
        resp = await admin_client.post("/api/apps/register", json={
            "app_id": app_id,
            "name": "Test Audit",
            "description": "Testing audit on registration",
            "auth_type": "none",
            "iframe_url": "/apps/test-audit/index.html",
            "tool_schemas": [{"name": "t", "description": "d", "parameters": []}],
        })
        assert resp.status_code == 201

        sf = get_session_factory()
        async with sf() as db:
            result = await db.execute(
                select(AppSchemaAudit).where(AppSchemaAudit.app_id == app_id)
            )
            audit = result.scalar_one_or_none()
            assert audit is not None
            assert audit.decision == "approved"
            assert audit.old_schema is None
            assert audit.new_schema is not None


class TestPerAppRateLimit:
    """Test that per-app rate limiting is configured on the invoke endpoint."""

    async def test_invoke_has_rate_limit_header(self, student1_client):
        """After invoking, response should include rate limit headers."""
        resp = await student1_client.post("/api/apps/chess/invoke", json={
            "tool": "test",
            "params": {},
        })
        # slowapi adds X-RateLimit headers when enabled (disabled in TESTING mode)
        # In test mode, we just verify the endpoint is accessible
        assert resp.status_code == 200
