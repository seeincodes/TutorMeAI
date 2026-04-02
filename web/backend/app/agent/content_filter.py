"""
SSE output content buffer and filter for K-12 safety.

Buffers streamed tokens into complete sentences, runs content filtering
against age-appropriate blocklists, and flushes only safe content to the
student's browser.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Blocklist definitions — phrases that must never reach a student
# ---------------------------------------------------------------------------

# Universal blocklist (all tiers)
_BLOCKLIST_UNIVERSAL: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"you'?re broke", re.IGNORECASE), "you're learning about budgeting"),
    (re.compile(r"can'?t afford", re.IGNORECASE), "might need to save up for"),
    (re.compile(r"you failed", re.IGNORECASE), "you can try again"),
    (re.compile(r"too late", re.IGNORECASE), "there's still time"),
    (re.compile(r"everyone else", re.IGNORECASE), "some people"),
    (re.compile(r"healthy\s+vs\.?\s+unhealthy", re.IGNORECASE), "different choices"),
    (re.compile(r"overweight", re.IGNORECASE), "growing"),
    (re.compile(r"debt collector", re.IGNORECASE), "financial helper"),
    (re.compile(r"eviction", re.IGNORECASE), "housing change"),
    (re.compile(r"bankrupt(cy)?", re.IGNORECASE), "financial restart"),
]

# Stricter rules for younger students (tier 1-2, roughly K-5)
_BLOCKLIST_STRICT: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\d+(\.\d+)?%", re.IGNORECASE), "a portion"),
    (re.compile(r"mortgage", re.IGNORECASE), "home payment"),
    (re.compile(r"interest rate", re.IGNORECASE), "extra cost"),
    (re.compile(r"inflation", re.IGNORECASE), "prices changing"),
    (re.compile(r"stock market", re.IGNORECASE), "money world"),
    (re.compile(r"deadline", re.IGNORECASE), "due date"),
]

# Sentence boundary characters
_SENTENCE_ENDERS = frozenset(".!?")

# Maximum tokens before a forced flush (safety valve)
MAX_BUFFER_TOKENS = 100


# ---------------------------------------------------------------------------
# Content filtering function
# ---------------------------------------------------------------------------

def filter_content(text: str, tier: int) -> tuple[str, bool]:
    """Filter a string against the K-12 blocklist.

    Parameters
    ----------
    text:
        The text to check.
    tier:
        Student tier (1-4).  Tiers 1-2 get stricter filtering.

    Returns
    -------
    tuple of (filtered_text, was_modified)
    """
    modified = False
    result = text

    # Always apply universal blocklist
    for pattern, replacement in _BLOCKLIST_UNIVERSAL:
        new_result, n = pattern.subn(replacement, result)
        if n > 0:
            modified = True
            result = new_result

    # Tiers 1-2: apply strict blocklist as well
    if tier <= 2:
        for pattern, replacement in _BLOCKLIST_STRICT:
            new_result, n = pattern.subn(replacement, result)
            if n > 0:
                modified = True
                result = new_result

    return result, modified


# ---------------------------------------------------------------------------
# Token buffer
# ---------------------------------------------------------------------------

@dataclass
class ContentBuffer:
    """Accumulates streamed tokens and flushes on sentence boundaries.

    Usage::

        buf = ContentBuffer(tier=1)
        for token in stream:
            ready = buf.add(token)
            if ready:
                safe_text, was_filtered = ready
                send_to_client(safe_text)
        # After stream ends, flush any remaining content
        remainder = buf.flush()
        if remainder:
            send_to_client(remainder[0])
    """

    tier: int = 3
    _buffer: str = field(default="", init=False, repr=False)
    _token_count: int = field(default=0, init=False, repr=False)

    # ---- public API -------------------------------------------------------

    def add(self, token: str) -> tuple[str, bool] | None:
        """Add a token to the buffer.

        Returns ``(filtered_text, was_modified)`` when the buffer is ready to
        flush (sentence boundary or max-token limit reached), otherwise
        ``None``.
        """
        self._buffer += token
        self._token_count += 1

        # Check for sentence boundary — only trigger on enders that look
        # like actual sentence endings (not decimals like "5.5%")
        if any(ch in _SENTENCE_ENDERS for ch in token):
            # A period inside a decimal (e.g., "5.5%", "$3.99") is not
            # a sentence boundary.  We check whether the ender character
            # sits right after a digit-dot-digit sequence within the
            # *current token* (i.e., the period is part of a number).
            is_decimal_dot = bool(re.search(r"\d\.\d", token))
            if not is_decimal_dot:
                return self._flush_internal()

        # Safety valve: flush after MAX_BUFFER_TOKENS tokens
        if self._token_count >= MAX_BUFFER_TOKENS:
            return self._flush_internal()

        return None

    def flush(self) -> tuple[str, bool] | None:
        """Flush any remaining buffered content.

        Call this when the stream ends to ensure nothing is left unsent.
        """
        if self._buffer:
            return self._flush_internal()
        return None

    # ---- internals --------------------------------------------------------

    def _flush_internal(self) -> tuple[str, bool]:
        text = self._buffer
        self._buffer = ""
        self._token_count = 0
        return filter_content(text, self.tier)
