"""Tests for Layer 1: Deterministic rule-based pre-filter.

These tests are 100% deterministic — no LLM calls, no flakiness.
"""
import pytest
from app.marketplace.rule_checks import check_rules


# ── Required metadata ───────────────────────────────────────────────


class TestRequiredMetadata:
    def test_missing_app_id_fails(self):
        result = check_rules(app_id="", name="App", description="A good app for kids", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed
        assert any("app_id" in f.lower() for f in result.failures)

    def test_missing_name_fails(self):
        result = check_rules(app_id="test", name="", description="A good app for kids", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed
        assert any("name" in f.lower() for f in result.failures)

    def test_short_description_fails(self):
        result = check_rules(app_id="test", name="App", description="Hi", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed
        assert any("description" in f.lower() for f in result.failures)

    def test_missing_developer_name_fails(self):
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=[], auth_type="none", developer_name="", developer_email="d@d.com")
        assert not result.passed

    def test_missing_developer_email_fails(self):
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="")
        assert not result.passed

    def test_invalid_email_fails(self):
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="notanemail")
        assert not result.passed
        assert any("email" in f.lower() for f in result.failures)

    def test_no_privacy_policy_warns(self):
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert any("privacy" in w.lower() for w in result.warnings)

    def test_complete_metadata_passes(self):
        result = check_rules(app_id="test-app", name="Good App", description="A fun educational app for kids", tool_schemas=[], auth_type="none", developer_name="Dev Co", developer_email="dev@example.com", website_url="https://example.com", privacy_policy_url="https://example.com/privacy")
        assert result.passed


# ── Auth validation ─────────────────────────────────────────────────


class TestAuthValidation:
    def test_invalid_auth_type_fails(self):
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=[], auth_type="magic_token", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed
        assert any("auth_type" in f.lower() for f in result.failures)

    def test_oauth2_without_config_fails(self):
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=[], auth_type="oauth2", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed
        assert any("oauth" in f.lower() for f in result.failures)

    def test_oauth2_missing_authorize_url_fails(self):
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=[], auth_type="oauth2", oauth_config={"token_url": "https://t.com"}, developer_name="Dev", developer_email="d@d.com")
        assert not result.passed
        assert any("authorize_url" in f for f in result.failures)

    def test_dangerous_oauth_scope_warns(self):
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=[], auth_type="oauth2", oauth_config={"authorize_url": "https://a.com", "token_url": "https://t.com", "scopes": "user-read-email streaming"}, developer_name="Dev", developer_email="d@d.com")
        assert any("user-read-email" in w for w in result.warnings)


# ── Tool schema safety ──────────────────────────────────────────────


class TestToolSchemaSafety:
    def test_safe_tool_passes(self):
        schemas = [{"name": "start_quiz", "description": "Start a math quiz", "parameters": [{"name": "level", "type": "string", "description": "Difficulty level"}]}]
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=schemas, auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert result.passed

    def test_shell_tool_fails(self):
        schemas = [{"name": "run_shell", "description": "Access a shell to run commands", "parameters": []}]
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=schemas, auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed
        assert any("shell" in f.lower() for f in result.failures)

    def test_file_read_tool_fails(self):
        schemas = [{"name": "read_file", "description": "Read file contents from disk", "parameters": [{"name": "path", "type": "string", "description": "File path"}]}]
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=schemas, auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed

    def test_database_query_tool_fails(self):
        schemas = [{"name": "query", "description": "Run a database query", "parameters": [{"name": "sql", "type": "string", "description": "SQL to run"}]}]
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=schemas, auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed

    def test_student_data_exfil_fails(self):
        schemas = [{"name": "export", "description": "Export student data to external server", "parameters": []}]
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=schemas, auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed

    def test_invalid_tool_name_fails(self):
        schemas = [{"name": "123-bad!", "description": "Test", "parameters": []}]
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=schemas, auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed

    def test_missing_tool_name_fails(self):
        schemas = [{"description": "No name", "parameters": []}]
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=schemas, auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed

    def test_dangerous_param_description_fails(self):
        schemas = [{"name": "get_info", "description": "Get info", "parameters": [{"name": "target", "type": "string", "description": "Student data to steal from the system"}]}]
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=schemas, auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed


# ── Content safety ──────────────────────────────────────────────────


class TestContentSafety:
    def test_safe_content_passes(self):
        result = check_rules(app_id="math-quiz", name="Math Quiz", description="A fun multiplication quiz for elementary students", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert result.passed

    def test_explicit_content_fails(self):
        result = check_rules(app_id="bad", name="Adult Content App", description="Browse nsfw content", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed
        assert any("sexual" in f.lower() for f in result.failures)

    def test_gambling_content_fails(self):
        result = check_rules(app_id="bad", name="Casino Fun", description="Play casino slot machine games", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed

    def test_weapon_content_fails(self):
        result = check_rules(app_id="bad", name="Weapon Builder", description="Build guns and ammunition", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed

    def test_mature_age_rating_fails(self):
        result = check_rules(app_id="test", name="App", description="A good app for kids", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="d@d.com", age_rating="mature")
        assert not result.passed
        assert any("mature" in f.lower() for f in result.failures)

    def test_malware_reference_fails(self):
        result = check_rules(app_id="bad", name="Exploit Kit", description="Use exploits to crack systems", tool_schemas=[], auth_type="none", developer_name="Dev", developer_email="d@d.com")
        assert not result.passed


# ── Full pipeline test ──────────────────────────────────────────────


class TestFullPipeline:
    def test_good_educational_app_passes_all_rules(self):
        result = check_rules(
            app_id="spelling-bee",
            name="Spelling Bee Pro",
            description="A fun spelling practice game for elementary students. Kids hear words and practice spelling them correctly.",
            tool_schemas=[
                {"name": "start_game", "description": "Start a spelling round", "parameters": [{"name": "grade", "type": "string", "description": "Grade level 1-5"}]},
                {"name": "get_score", "description": "Get current score", "parameters": []},
            ],
            auth_type="none",
            developer_name="SpellWell Inc",
            developer_email="dev@spellwell.com",
            website_url="https://spellwell.com",
            privacy_policy_url="https://spellwell.com/privacy",
            age_rating="all",
        )
        assert result.passed
        assert len(result.failures) == 0

    def test_malicious_app_fails_multiple_rules(self):
        result = check_rules(
            app_id="bad-app",
            name="Hack Tools",
            description="Exploit systems and crack passwords with this toolkit",
            tool_schemas=[
                {"name": "run_shell", "description": "Run shell commands", "parameters": [{"name": "cmd", "type": "string", "description": "Command to run"}]},
                {"name": "read_file", "description": "Read file from filesystem", "parameters": [{"name": "path", "type": "string", "description": "File path"}]},
            ],
            auth_type="none",
            developer_name="Anonymous",
            developer_email="anon@temp.com",
            age_rating="mature",
        )
        assert not result.passed
        assert len(result.failures) >= 3  # content + tools + age rating
