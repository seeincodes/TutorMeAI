"""Server-side relay for third-party app tool invocations.

Instead of returning params to the frontend for postMessage dispatch,
the relay forwards invocations to the app's server-side API endpoint
with HMAC request signing.
"""

import hashlib
import hmac
import json
import time

import httpx

RELAY_TIMEOUT_SECONDS = 30


def compute_relay_signature(secret: str, payload: dict, timestamp: int) -> str:
    """Compute HMAC-SHA256 signature for a relay request.

    The signed message is: "{timestamp}.{canonical_json_payload}"
    """
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    message = f"{timestamp}.{canonical}"
    return hmac.new(
        secret.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()


def verify_relay_signature(secret: str, payload: dict, timestamp: int, signature: str) -> bool:
    """Verify an HMAC-SHA256 signature."""
    expected = compute_relay_signature(secret, payload, timestamp)
    return hmac.compare_digest(expected, signature)


async def relay_to_app(
    server_api_url: str,
    signing_secret: str | None,
    tool: str,
    params: dict,
) -> dict:
    """Forward a tool invocation to the app's backend and return the response.

    Raises:
        httpx.TimeoutException: if the app doesn't respond within RELAY_TIMEOUT_SECONDS
        httpx.HTTPStatusError: if the app returns a non-2xx status
    """
    payload = {"tool": tool, "params": params}
    timestamp = int(time.time())

    headers: dict[str, str] = {"Content-Type": "application/json"}
    if signing_secret:
        sig = compute_relay_signature(signing_secret, payload, timestamp)
        headers["X-ChatBridge-Signature"] = sig
        headers["X-ChatBridge-Timestamp"] = str(timestamp)

    async with httpx.AsyncClient(timeout=RELAY_TIMEOUT_SECONDS) as client:
        response = await client.post(
            server_api_url,
            json=payload,
            headers=headers,
        )

    response.raise_for_status()
    return response.json()
