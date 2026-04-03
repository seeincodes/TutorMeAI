import hashlib
import json


def compute_schema_hash(tool_schemas: list[dict]) -> str:
    """Compute a deterministic SHA-256 hash of tool schemas.

    Sorts keys to ensure consistent hashing regardless of insertion order.
    """
    canonical = json.dumps(tool_schemas, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()
