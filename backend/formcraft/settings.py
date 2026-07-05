from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()


def _split_env_list(value):
    if not value:
        return []
    cleaned = value.strip()
    if cleaned.startswith('[') and cleaned.endswith(']'):
        cleaned = cleaned[1:-1]
    parts = []
    for item in cleaned.split(','):
        candidate = item.strip().strip('"').strip("'")
        if candidate:
            parts.append(candidate)
    return parts


def _normalize_host(host):
    value = host.strip()
    if '://' in value:
        value = value.split('://', 1)[1]
    value = value.split('/', 1)[0]
    if value.startswith('.'):
        return value
    if ':' in value and not value.startswith('['):
        value = value.split(':', 1)[0]
    return value


BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-formcraft-dev-key-change-in-prod')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
raw_allowed_hosts = _split_env_list(os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1'))
ALLOWED_HOSTS = ['*'] if '*' in raw_allowed_hosts else [_normalize_host(host) for host in raw_allowed_hosts]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'users.apps.UsersConfig',
    'forms.apps.FormsConfig',
    'responses.apps.ResponsesConfig',
    'analytics.apps.AnalyticsConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'formcraft.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.debug',
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

WSGI_APPLICATION = 'formcraft.wsgi.application'

# ── Database ──────────────────────────────────────────────────────────────────
# Default: SQLite3 (zero config, works instantly)
# Upgrade path: set DB_ENGINE=django.db.backends.postgresql in .env + fill credentials
# DATABASES = {
#     'default': {
#         'ENGINE':   os.getenv('DB_ENGINE',   'django.db.backends.sqlite3'),
#         'NAME':     os.getenv('DB_NAME',     str(BASE_DIR / 'db.sqlite3')),
#         'USER':     os.getenv('DB_USER',     ''),
#         'PASSWORD': os.getenv('DB_PASSWORD', ''),
#         'HOST':     os.getenv('DB_HOST',     'localhost'),
#         'PORT':     os.getenv('DB_PORT',     '5432'),
#     }
# }
import dj_database_url

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"
    )
}

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 4}},
]

# ── REST Framework ────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework_simplejwt.authentication.JWTAuthentication'],
    'DEFAULT_PERMISSION_CLASSES':     ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_RENDERER_CLASSES':       ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS':  True,
}

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000'
)
CORS_ALLOWED_ORIGINS = _split_env_list(CORS_ALLOWED_ORIGINS)
CORS_ALLOW_CREDENTIALS = True

# ── Email (Gmail SMTP) ────────────────────────────────────────────────────────
# Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env to enable
EMAIL_BACKEND    = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST       = os.getenv('EMAIL_HOST',       'smtp.gmail.com')
EMAIL_PORT       = int(os.getenv('EMAIL_PORT',   '587'))
EMAIL_USE_TLS    = os.getenv('EMAIL_USE_TLS',    'True') == 'True'
EMAIL_HOST_USER  = os.getenv('EMAIL_HOST_USER',  '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL  = os.getenv('DEFAULT_FROM_EMAIL', 'FormCraft <noreply@formcraft.app>')

# If email not configured → use console backend (prints to terminal)
if not EMAIL_HOST_USER:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ── Static & Media ────────────────────────────────────────────────────────────
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL   = '/media/'
MEDIA_ROOT  = BASE_DIR / 'media'

# ── Max upload size: 10 MB ────────────────────────────────────────────────────
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'Asia/Kolkata'
USE_I18N      = True
USE_TZ        = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"