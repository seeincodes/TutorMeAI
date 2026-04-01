from cryptography.fernet import Fernet

from app.config import settings


def _get_fernet() -> Fernet:
    key = settings.oauth_encryption_key
    if not key:
        key = Fernet.generate_key().decode()
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_token(token: str) -> str:
    return _get_fernet().encrypt(token.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    return _get_fernet().decrypt(encrypted.encode()).decode()
