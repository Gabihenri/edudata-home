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

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "edudata-ia-development-secret-change-in-production",
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