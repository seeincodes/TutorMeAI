"""Content moderation filter for tool results.

Screens tool result text for K-12 inappropriate content before
passing it to the LangGraph agent. Uses keyword-based detection
as a fast local filter (OpenAI Moderation API can be layered on top).
"""

import re

# Patterns that should be flagged in K-12 context
_HARMFUL_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\b(hate|stupid|idiot|dumb|loser)\b.*\b(you|kid|child|student)\b", re.IGNORECASE),
    re.compile(r"\b(you|kid|child|student)\b.*\b(hate|stupid|idiot|dumb|loser)\b", re.IGNORECASE),
    re.compile(r"\b(kill|murder|stab|shoot|bleed|die)\b.*\b(them|everyone|all|enemies)\b", re.IGNORECASE),
    re.compile(r"\b(them|everyone|all|enemies)\b.*\b(kill|murder|stab|shoot|bleed|die)\b", re.IGNORECASE),
    re.compile(r"\bsuicid", re.IGNORECASE),
    re.compile(r"\bself[- ]?harm", re.IGNORECASE),
    re.compile(r"\b(porn|nude|naked|sex)\b", re.IGNORECASE),
    re.compile(r"\b(drug|cocaine|heroin|meth)\b", re.IGNORECASE),
]

_SAFE_FALLBACK = "[Content removed for safety. Please try a different request.]"


def moderate_tool_result(text: str) -> dict:
    """Screen tool result text for inappropriate content.

    Returns:
        dict with keys:
            - flagged: bool — whether the content was flagged
            - safe_text: str — the original text if clean, or a safe fallback
            - categories: list[str] — which patterns matched (empty if clean)
    """
    categories: list[str] = []

    for pattern in _HARMFUL_PATTERNS:
        if pattern.search(text):
            categories.append(pattern.pattern)

    flagged = len(categories) > 0

    return {
        "flagged": flagged,
        "safe_text": _SAFE_FALLBACK if flagged else text,
        "categories": categories,
    }
