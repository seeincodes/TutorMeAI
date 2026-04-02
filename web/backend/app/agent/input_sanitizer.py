"""Student input sanitization for prompt injection prevention.

Cleans student free-text before it enters the LLM context to prevent:
- Prompt injection attacks
- Control-plane injection (e.g., [LEVEL_UP_LIFE] prefixes)
- HTML/script injection
- CSAM/harmful content patterns
"""

import re

# Maximum allowed message length (characters)
MAX_MESSAGE_LENGTH = 1000

# Control-plane delimiters used internally — students should never inject these
_CONTROL_PREFIX_PATTERN = re.compile(
    r"\[(?:LEVEL_UP_LIFE|TOOL_RESULT_START|TOOL_RESULT_END|SYSTEM_OVERRIDE|ADMIN_CMD)[^\]]*\]",
    re.IGNORECASE,
)

# Prompt injection patterns — phrases students might use to hijack the system prompt
_INJECTION_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE), "prompt_injection:ignore_instructions"),
    (re.compile(r"ignore\s+(all\s+)?prior\s+instructions", re.IGNORECASE), "prompt_injection:ignore_instructions"),
    (re.compile(r"disregard\s+(all\s+)?previous\s+instructions", re.IGNORECASE), "prompt_injection:ignore_instructions"),
    (re.compile(r"system\s*prompt", re.IGNORECASE), "prompt_injection:system_prompt_ref"),
    (re.compile(r"you\s+are\s+now\b", re.IGNORECASE), "prompt_injection:role_override"),
    (re.compile(r"forget\s+your\s+rules", re.IGNORECASE), "prompt_injection:forget_rules"),
    (re.compile(r"pretend\s+you\s+are", re.IGNORECASE), "prompt_injection:pretend"),
    (re.compile(r"act\s+as\s+(?:if\s+you\s+(?:are|were)|a\s+(?:different|new))", re.IGNORECASE), "prompt_injection:role_override"),
    (re.compile(r"new\s+instructions?\s*:", re.IGNORECASE), "prompt_injection:new_instructions"),
    (re.compile(r"override\s+(?:your\s+)?(?:system|instructions|rules)", re.IGNORECASE), "prompt_injection:override"),
]

# HTML / script tag pattern
_HTML_TAG_PATTERN = re.compile(r"<[^>]+>")

# Harmful content patterns (obvious, high-confidence signals only)
_HARMFUL_PATTERNS: list[re.Pattern] = [
    re.compile(r"\b(?:how\s+to\s+(?:make|build)\s+(?:a\s+)?(?:bomb|explosive|weapon))\b", re.IGNORECASE),
    re.compile(r"\b(?:how\s+to\s+(?:hurt|kill|harm)\s+(?:myself|someone|people))\b", re.IGNORECASE),
    re.compile(r"\b(?:child\s+(?:porn|exploitation|abuse\s+images?))\b", re.IGNORECASE),
    re.compile(r"\b(?:suicide\s+(?:method|instructions|how\s+to))\b", re.IGNORECASE),
]


def sanitize_student_input(text: str) -> tuple[str, list[str]]:
    """Sanitize student free-text before it enters the LLM context.

    Returns a tuple of (cleaned_text, flags) where flags is a list of
    string identifiers for any issues detected during sanitization.
    The message is never blocked outright — it is cleaned and flagged.
    """
    flags: list[str] = []

    # 1. Strip control-plane prefixes/delimiters
    if _CONTROL_PREFIX_PATTERN.search(text):
        flags.append("control_prefix_stripped")
        text = _CONTROL_PREFIX_PATTERN.sub("", text)

    # 2. Detect and strip prompt injection patterns
    for pattern, flag in _INJECTION_PATTERNS:
        if pattern.search(text):
            flags.append(flag)
            text = pattern.sub("", text)

    # 3. Strip HTML/script tags
    if _HTML_TAG_PATTERN.search(text):
        flags.append("html_stripped")
        text = _HTML_TAG_PATTERN.sub("", text)

    # 4. Truncate to max length
    if len(text) > MAX_MESSAGE_LENGTH:
        flags.append("message_truncated")
        text = text[:MAX_MESSAGE_LENGTH]

    # 5. Clean up extra whitespace from removals
    text = re.sub(r"  +", " ", text).strip()

    return text, flags


def is_safe_for_llm(text: str) -> bool:
    """Check whether a message contains obvious harmful content patterns.

    Returns False if the message matches any high-confidence harmful
    content pattern. This is a coarse filter — the LLM's own content
    policy provides the fine-grained layer.
    """
    for pattern in _HARMFUL_PATTERNS:
        if pattern.search(text):
            return False
    return True
