import hmac
from typing import Optional
from fastapi import Header, Query, HTTPException, status
from backend.app.config import settings


def verify_admin_key(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    admin_key: Optional[str] = Query(None)
) -> bool:
    """
    Enforces administrative authentication for privileged mutations.
    Accepts admin key via 'X-Admin-Key' HTTP header or 'admin_key' query parameter.
    Uses constant-time comparison (hmac.compare_digest) to prevent timing attacks.
    """
    provided_key = x_admin_key or admin_key

    if not provided_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid X-Admin-Key header or admin_key query parameter required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Constant-time comparison to mitigate side-channel timing attacks
    is_valid_admin = hmac.compare_digest(provided_key, settings.ADMIN_API_KEY)
    is_valid_secret = hmac.compare_digest(provided_key, settings.SECRET_KEY)

    if is_valid_admin or is_valid_secret:
        return True

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized: Invalid administrative credentials provided.",
        headers={"WWW-Authenticate": "Bearer"},
    )
