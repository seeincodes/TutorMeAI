"""
Layer 1: Deterministic rule-based pre-filter for marketplace app submissions.

Validates tool schemas, auth configuration, required metadata, and content
patterns against a hard-coded checklist. Binary pass/fail — no LLM calls,
no flakiness, zero cost.

This layer catches 70-80% of rejections instantly, so the AI layer (Layer 2)
only sees apps that pass basic safety and completeness checks.
"""
import re
from dataclasses import dataclass, field


@dataclass
class RuleCheckResult:
    passed: bool
    failures: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


# ── Blocked patterns ────────────────────────────────────────────────────

# Tool names/descriptions that indicate dangerous capabilities
DANGEROUS_TOOL_PATTERNS = [
    (r"\brun.?command\b", "Tool appears to run arbitrary commands"),
    (r"\bshell\b", "Tool appears to access a shell"),
    (r"\bsystem.?call\b", "Tool appears to make system calls"),
    (r"\bfile.?system\b", "Tool appears to access the file system"),
    (r"\bread.?file\b", "Tool appears to read arbitrary files"),
    (r"\bwrite.?file\b", "Tool appears to write arbitrary files"),
    (r"\bdelete.?file\b", "Tool appears to delete files"),
    (r"\bnetwork.?request\b", "Tool appears to make arbitrary network requests"),
    (r"\braw.?sql\b", "Tool appears to run raw SQL"),
    (r"\bdatabase.?query\b", "Tool appears to run database queries"),
    (r"\broot\b.*\baccess\b", "Tool appears to request root access"),
    (r"\badmin\b.*\bpanel\b", "Tool appears to access admin functionality"),
    (r"\bprocess\b.*\bkill\b", "Tool appears to kill processes"),
    (r"\bsudo\b", "Tool appears to use elevated privileges"),
    (r"\bcrypto.?min(e|ing)\b", "Tool appears to mine cryptocurrency"),
    (r"\bkeylog\b", "Tool appears to log keystrokes"),
    (r"\bscreen.?capture\b", "Tool may capture screen content"),
    (r"\bpassword\b.*\b(steal|dump)\b", "Tool may steal passwords"),
    (r"\bpii\b.*\b(collect|exfiltrate)\b", "Tool may collect PII"),
    (r"\bstudent\b.*\bdata\b.*\b(steal|export|extract|send)\b", "Tool may exfiltrate student data"),
    (r"\bexport\b.*\bstudent\b", "Tool may export student data"),
    (r"\bexfiltrat\b", "Tool may exfiltrate data"),
]

# Blocked words in app name or description
BLOCKED_CONTENT_PATTERNS = [
    (r"\b(porn|xxx|adult.content|nsfw|erotic|sexual)\b", "Contains sexually explicit content"),
    (r"\b(exploit|crack|phish|malware|ransomware|trojan)\b", "References malware or exploits"),
    (r"\b(gambling|casino|betting|slot.machine)\b", "Contains gambling content"),
    (r"\b(cocaine|heroin|meth)\b", "References hard drugs"),
    (r"\b(weapon|gun|bomb|explosive|ammunition)\b", "References weapons"),
    (r"\b(gore|torture|mutilat)\b", "Contains violent/graphic content"),
    (r"\b(self.harm)\b", "References self-harm"),
    (r"\b(hate.speech|white.supremac|nazi)\b", "Contains hate speech"),
]

# OAuth scopes that are overly broad or dangerous for K-12
DANGEROUS_OAUTH_SCOPES = [
    "user-read-email",
    "user-read-private",
    "user-library-modify",
    "playlist-modify-public",
    "user-follow-modify",
    "ugc-image-upload",
]

VALID_AUTH_TYPES = {"none", "api_key", "oauth2"}


def check_rules(
    app_id: str,
    name: str,
    description: str,
    tool_schemas: list[dict],
    auth_type: str,
    oauth_config: dict | None = None,
    developer_name: str | None = None,
    developer_email: str | None = None,
    website_url: str | None = None,
    privacy_policy_url: str | None = None,
    age_rating: str = "all",
) -> RuleCheckResult:
    """
    Run deterministic rule checks on an app submission.
    Returns RuleCheckResult with passed=False if any critical rule fails.
    """
    failures: list[str] = []
    warnings: list[str] = []

    # ── 1. Required metadata ────────────────────────────────────────
    if not app_id or not app_id.strip():
        failures.append("Missing app_id")
    if not name or not name.strip():
        failures.append("Missing app name")
    if not description or len(description.strip()) < 10:
        failures.append("Description too short (minimum 10 characters)")
    if not developer_name or not developer_name.strip():
        failures.append("Missing developer name")
    if not developer_email or not developer_email.strip():
        failures.append("Missing developer email")
    elif not re.match(r"^[^@]+@[^@]+\.[^@]+$", developer_email):
        failures.append("Invalid developer email format")

    if not privacy_policy_url:
        warnings.append("No privacy policy URL provided — recommended for K-12 apps")
    if not website_url:
        warnings.append("No website URL provided")

    # ── 2. Auth type validation ─────────────────────────────────────
    if auth_type not in VALID_AUTH_TYPES:
        failures.append(f"Invalid auth_type: {auth_type}. Must be one of: {VALID_AUTH_TYPES}")

    if auth_type == "oauth2":
        if not oauth_config:
            failures.append("OAuth2 auth_type requires oauth_config")
        else:
            if not oauth_config.get("authorize_url"):
                failures.append("OAuth config missing authorize_url")
            if not oauth_config.get("token_url"):
                failures.append("OAuth config missing token_url")

            scopes = oauth_config.get("scopes", "")
            for dangerous_scope in DANGEROUS_OAUTH_SCOPES:
                if dangerous_scope in scopes:
                    warnings.append(f"OAuth scope '{dangerous_scope}' may be overly broad for K-12")

    # ── 3. Tool schema safety ───────────────────────────────────────
    if not isinstance(tool_schemas, list):
        failures.append("tool_schemas must be a list")
    else:
        for i, schema in enumerate(tool_schemas):
            if not isinstance(schema, dict):
                failures.append(f"Tool schema [{i}] is not a valid object")
                continue

            tool_name = schema.get("name", "")
            tool_desc = schema.get("description", "")
            tool_text = f"{tool_name} {tool_desc}".lower()

            if not tool_name or not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", tool_name):
                failures.append(f"Tool [{i}] has invalid name: '{tool_name}'")

            for pattern, message in DANGEROUS_TOOL_PATTERNS:
                if re.search(pattern, tool_text, re.IGNORECASE):
                    failures.append(f"Tool '{tool_name}': {message}")
                    break

            params = schema.get("parameters", [])
            if not isinstance(params, list):
                failures.append(f"Tool '{tool_name}' parameters must be a list")
            else:
                for j, param in enumerate(params):
                    if not isinstance(param, dict):
                        failures.append(f"Tool '{tool_name}' param [{j}] is not a valid object")
                        continue
                    if not param.get("name"):
                        failures.append(f"Tool '{tool_name}' param [{j}] missing name")
                    param_desc = (param.get("description", "") or "").lower()
                    for pattern, message in DANGEROUS_TOOL_PATTERNS:
                        if re.search(pattern, param_desc, re.IGNORECASE):
                            failures.append(f"Tool '{tool_name}' param '{param.get('name', '?')}': {message}")
                            break

    # ── 4. Content safety (name + description) ─────────────────────
    content_text = f"{name} {description}".lower()
    for pattern, message in BLOCKED_CONTENT_PATTERNS:
        if re.search(pattern, content_text, re.IGNORECASE):
            failures.append(f"Content check: {message}")

    # ── 5. Age rating validation ────────────────────────────────────
    valid_ratings = {"all", "elementary", "middle_school", "high_school", "teen"}
    if age_rating == "mature":
        failures.append("Mature-rated apps are not allowed on a K-12 platform")
    elif age_rating not in valid_ratings:
        warnings.append(f"Unrecognized age_rating: {age_rating}")

    # ── 6. App ID format ────────────────────────────────────────────
    if app_id and not re.match(r"^[a-zA-Z0-9][a-zA-Z0-9_-]*$", app_id):
        failures.append("app_id must be alphanumeric with hyphens/underscores")

    return RuleCheckResult(
        passed=len(failures) == 0,
        failures=failures,
        warnings=warnings,
    )
