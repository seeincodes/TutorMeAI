from fastapi import Query


def pagination_params(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> dict:
    return {"limit": limit, "offset": offset}
