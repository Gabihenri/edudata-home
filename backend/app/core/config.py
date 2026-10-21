import os

from dotenv import load_dotenv

load_dotenv()

# ==========================================================
# SUPABASE
# ==========================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# ==========================================================
# JWT
# ==========================================================

_DEVELOPMENT_SECRET_KEY = "edudata-ia-development-secret-change-in-production"
_SECRET_KEY_ENV = os.getenv("SECRET_KEY")
SECRET_KEY = _SECRET_KEY_ENV or _DEVELOPMENT_SECRET_KEY

# Render exposes RENDER_SERVICE_ID in deployed services. APP_ENV/ENVIRONMENT
# also allow other deployment platforms to declare production explicitly.
_APP_ENV = os.getenv("APP_ENV", os.getenv("ENVIRONMENT", "")).strip().lower()
_IS_PRODUCTION = _APP_ENV == "production" or bool(os.getenv("RENDER_SERVICE_ID"))

if _IS_PRODUCTION and (
    not _SECRET_KEY_ENV or _SECRET_KEY_ENV == _DEVELOPMENT_SECRET_KEY
):
    raise RuntimeError(
        "SECRET_KEY must be configured with a unique secret in production."
    )

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256",
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60",
    )
)

# ==========================================================
# APPLICATION
# ==========================================================

APP_NAME = "EduData IA"

API_VERSION = "v1"

DEBUG = os.getenv("DEBUG", "false").lower() == "true"
