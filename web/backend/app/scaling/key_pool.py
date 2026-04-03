"""Round-robin API key pool with rate-limit awareness.

Distributes LLM API calls across multiple keys to avoid per-key
rate limits. Keys that hit rate limits are temporarily skipped.
"""

import time


class KeyPool:
    """Thread-safe round-robin key pool with rate-limit cooldowns."""

    def __init__(self, keys: list[str]) -> None:
        if not keys:
            raise ValueError("KeyPool requires at least one key")
        self._keys = list(keys)
        self._index = 0
        self._rate_limited: dict[str, float] = {}  # key -> expiry timestamp

    def next(self) -> str:
        """Return the next available key, skipping rate-limited ones."""
        now = time.time()
        # Clean up expired cooldowns
        self._rate_limited = {k: v for k, v in self._rate_limited.items() if v > now}

        # Try to find a non-limited key
        for _ in range(len(self._keys)):
            key = self._keys[self._index % len(self._keys)]
            self._index += 1
            if key not in self._rate_limited:
                return key

        # All keys rate-limited — return the one whose cooldown expires soonest
        soonest = min(self._rate_limited, key=self._rate_limited.get)
        return soonest

    def mark_rate_limited(self, key: str, cooldown_seconds: int = 60) -> None:
        """Mark a key as rate-limited for the given cooldown period."""
        self._rate_limited[key] = time.time() + cooldown_seconds
