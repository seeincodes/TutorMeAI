"""Security headers middleware and user-tier derivation for K-12 platform."""

from __future__ import annotations


class SecurityHeadersMiddleware:
    """Pure ASGI middleware that adds security headers to every HTTP response.

    Headers added:
    - Content-Security-Policy (script-src 'self' 'unsafe-inline'; frame-ancestors 'self')
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: SAMEORIGIN
    - Referrer-Policy: strict-origin-when-cross-origin
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((
                    b"content-security-policy",
                    b"script-src 'self' 'unsafe-inline'; frame-ancestors 'self'",
                ))
                headers.append((b"x-content-type-options", b"nosniff"))
                headers.append((b"x-frame-options", b"SAMEORIGIN"))
                headers.append((
                    b"referrer-policy",
                    b"strict-origin-when-cross-origin",
                ))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_with_headers)


def derive_user_tier(
    user_grade: int | None = None,
    capability_override: int | None = None,
) -> int:
    """Derive the capability tier for a student based on grade level.

    Args:
        user_grade: The student's grade level (0-12+). ``None`` means unknown.
        capability_override: If set, this tier is returned directly.

    Returns:
        An integer tier from 1-4:
        - Tier 1: grades 0-1 (K-1)
        - Tier 2: grades 2-4
        - Tier 3: grades 5-6
        - Tier 4: grades 7+
        - Default (no grade): tier 2
    """
    if capability_override is not None:
        return capability_override

    if user_grade is None:
        return 2

    if user_grade <= 1:
        return 1
    if user_grade <= 4:
        return 2
    if user_grade <= 6:
        return 3
    return 4
