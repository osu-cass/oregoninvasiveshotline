# -*- coding: utf-8 -*-
import os
import os.path
from pathlib import Path

from celery.schedules import crontab
import environ
from csp.constants import SELF, UNSAFE_INLINE, NONE, NONCE
from inertia.settings import settings as inertia_settings

# Due to an issue with the types of env(), when passing a default you must add a pyright ignore statement
# This is because it has a type defualt of NoValue, which the type that is being passed in will not satisfy

# Initialize django-environ
env = environ.Env(
    # Set default values and casting
    DEBUG=(bool, False),
    TEMPLATE_DEBUG=(bool, False),
    DJANGO_ENV=(str, 'dev'),
    ALLOWED_HOSTS=(list, []),
    SECRET_KEY=(str, 'not a secret'),
    DB_ENGINE=(str, 'django.contrib.gis.db.backends.postgis'),
    DB_NAME=(str, 'invasives'),
    DB_USER=(str, 'invasives'),
    DB_PASSWORD=(str, ''),
    DB_HOST=(str, 'localhost'),
    DB_PORT=(str, '5432'),
    EMAIL_BACKEND=(str, 'django.core.mail.backends.console.EmailBackend'),
    DEFAULT_FROM_EMAIL=(str, 'no-reply@oregoninvasiveshotline.org'),
    NOTIFICATIONS_FROM_EMAIL=(str, 'no-reply@oregoninvasiveshotline.org'),
    SERVER_EMAIL=(str, 'no-reply@oregoninvasiveshotline.org'),
    EMAIL_HOST=(str, ''),
    EMAIL_PORT=(int, 587),
    EMAIL_USE_TLS=(bool, True),
    EMAIL_HOST_USER=(str, ''),
    EMAIL_HOST_PASSWORD=(str, ''),
    CELERY_BROKER_URL=(str, 'pyamqp://guest:guest@localhost//'),
    CELERY_TASK_ALWAYS_EAGER=(bool, False),
    STATIC_ROOT=(str, ''),
    MEDIA_ROOT=(str, ''),
    STATICFILES_STORAGE=(str, 'django.contrib.staticfiles.storage.StaticFilesStorage'),
    CSRF_COOKIE_HTTPONLY=(bool, True),
    CSRF_COOKIE_SECURE=(bool, True),
    SESSION_COOKIE_SECURE=(bool, True),
    SECURE_PROXY_SSL_HEADER=(str, ''),
    GOOGLE_API_KEY=(str, ''),
    GOOGLE_ANALYTICS_TRACKING_ID=(str, ''),
    SENTRY_DSN=(str, ''),
    SENTRY_ENVIRONMENT=(str, ''),
    SENTRY_TRACES_SAMPLE_RATE=(float, 0.1),
    SECURE_HSTS_SECONDS=(int, 31536000),
    DJANGO_VITE_DEV_SERVER_HOST=(str, "localhost"),
    DJANGO_VITE_DEV_SERVER_PORT=(int, 5173),
    DATA_UPLOAD_MAX_MEMORY_SIZE=(int, 5242880)
)

BASE_DIR = Path(__file__).resolve().parent.parent
BASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FILE_ROOT = os.path.abspath(os.path.join(BASE_PATH, '..'))

# Read environment variables from .env file
environ.Env.read_env(os.path.join(FILE_ROOT, '.env'))

# Helper function to read Docker secrets
def read_secret(secret_name, default=''):
    """Read a Docker secret from /run/secrets/ or fall back to environment variable."""
    secret_path = f'/run/secrets/{secret_name}'
    if os.path.exists(secret_path):
        with open(secret_path, 'r') as f:
            return f.read().strip()
    return env(secret_name, default=default) # pyright: ignore

# Core Django settings
DEBUG = env('DEBUG')  # pyright: ignore
TEMPLATE_DEBUG = env('TEMPLATE_DEBUG', default=DEBUG)  # pyright: ignore
SECRET_KEY = read_secret('SECRET_KEY', str(env('SECRET_KEY')))
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

# Environment name (for display in templates)
ENV = env('DJANGO_ENV')

# Expose Sentry settings for templates and context processors
SENTRY_DSN = env('SENTRY_DSN', default='') # pyright: ignore
SENTRY_ENVIRONMENT = env('SENTRY_ENVIRONMENT', default=ENV) # pyright: ignore
SENTRY_TRACES_SAMPLE_RATE = env('SENTRY_TRACES_SAMPLE_RATE')

ROOT_URLCONF = "oregoninvasiveshotline.urls"
WSGI_APPLICATION = "oregoninvasiveshotline.wsgi.application"
SITE_ID = 1

# Email/correspondence settings
SERVER_EMAIL = env('SERVER_EMAIL')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL')
ADMINS = [["PSU Web & Mobile Team", "webteam@pdx.edu"]]
MANAGERS = [["PSU Web & Mobile Team", "webteam@pdx.edu"]]
EMAIL_SUBJECT_PREFIX = "[Oregon Invasive Hotline] "
EMAIL_BACKEND = env('EMAIL_BACKEND')

# SMTP Settings (if using SMTP backend)
if env('EMAIL_HOST'):
    EMAIL_HOST = env('EMAIL_HOST')
    EMAIL_PORT = env('EMAIL_PORT')
    EMAIL_USE_TLS = env('EMAIL_USE_TLS')
    EMAIL_HOST_USER = env('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/Los_Angeles'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_ETAGS = True
USE_I18N = True
USE_L10N = True
USE_TZ = True

# CSRF and Security Settings
CSRF_COOKIE_HTTPONLY = env('CSRF_COOKIE_HTTPONLY')
CSRF_COOKIE_SECURE = env('CSRF_COOKIE_SECURE')
SESSION_COOKIE_SECURE = env('SESSION_COOKIE_SECURE')

# Static and Media Files
STATIC_ROOT = env('STATIC_ROOT', default=os.path.join(FILE_ROOT, 'static'))  # pyright: ignore
STATIC_URL = '/static/'
MEDIA_ROOT = env('MEDIA_ROOT', default=os.path.join(FILE_ROOT, 'media'))  # pyright: ignore
MEDIA_URL = '/media/'
STATICFILES_STORAGE = env('STATICFILES_STORAGE')

# TODO: Temporary increase to 5MB to support many file uploads (see AB#4342); 
#   need to evaluate if this can be reduced after implementing a new file upload mechanism
DATA_UPLOAD_MAX_MEMORY_SIZE = env('DATA_UPLOAD_MAX_MEMORY_SIZE')

# Logging configuration
FIRST_PARTY_LOGGER = {
    'handlers': ['console'],
    'propagate': False,
    'level': 'INFO'
}
THIRD_PARTY_LOGGER = {
    'handlers': ['console'],
    'propagate': False,
    'level': 'WARN'
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '%(asctime)s %(levelname)s [%(name)s] %(message)s'
        }
    },
    'filters': {},
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
    },
    'loggers': {
        'oregoninvasiveshotline': FIRST_PARTY_LOGGER,
        'celery.task': FIRST_PARTY_LOGGER,
        'django': THIRD_PARTY_LOGGER,
    },
    'root': THIRD_PARTY_LOGGER
}

LOGIN_URL = "login"
LOGIN_REDIRECT_URL = "users-home"

AUTHENTICATION_BACKENDS = ["django.contrib.auth.backends.AllowAllUsersModelBackend"]
AUTH_USER_MODEL = "users.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"}
]
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.BCryptPasswordHasher',
]

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [os.path.join(BASE_PATH, 'templates')],
    'APP_DIRS': True,
    'OPTIONS': {
        'builtins': [
            "oregoninvasiveshotline.templatetags.arc"
        ],
        'context_processors': [
            "django.template.context_processors.debug",
            "django.template.context_processors.request",
            "django.contrib.auth.context_processors.auth",
            "django.contrib.messages.context_processors.messages",
            "django.template.context_processors.media",
            "django.template.context_processors.static",
            "django.template.context_processors.tz",
            "oregoninvasiveshotline.context_processors.defaults"
        ]
    }
}]

INSTALLED_APPS = [
    "oregoninvasiveshotline.apps.MainAppConfig",
    "oregoninvasiveshotline.permissions",
    "oregoninvasiveshotline.comments",
    "oregoninvasiveshotline.counties",
    "oregoninvasiveshotline.images",
    "oregoninvasiveshotline.notifications",
    "oregoninvasiveshotline.pages",
    "oregoninvasiveshotline.reports",
    "oregoninvasiveshotline.species",
    "oregoninvasiveshotline.users",

    "rest_framework",
    "django_bootstrap5",
    "csp",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "django.contrib.flatpages",
    "django.contrib.gis",

    "django_vite",
    "inertia",
]

MIDDLEWARE = [
    "csp.middleware.CSPMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django.middleware.http.ConditionalGetMiddleware",

    "inertia.middleware.InertiaMiddleware",
]

CONTENT_SECURITY_POLICY = {
    "DIRECTIVES": {
        "default-src": [SELF],
        "script-src": [SELF, "https://cdn.jsdelivr.net", "https://maps.googleapis.com", NONCE],
        "style-src": [SELF, "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", UNSAFE_INLINE],
        "img-src": [SELF, "data:", "https:"],
        "font-src": [SELF, "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        "connect-src": [SELF, "https://cdn.jsdelivr.net", "https://maps.googleapis.com"],
        "object-src": [NONE],
        "base-uri": [SELF],
        "form-action": [SELF],
        "frame-ancestors": [NONE],
        "upgrade-insecure-requests": True,
    }
}

if DEBUG:
    CONTENT_SECURITY_POLICY["DIRECTIVES"]["script-src"].extend([
        "http://localhost:5173",
        UNSAFE_INLINE,
    ])
    CONTENT_SECURITY_POLICY["DIRECTIVES"]["connect-src"].extend([
        "http://localhost:5173",
        "ws://localhost:5173",  # For HMR websocket
    ])

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = env('SECURE_HSTS_SECONDS')
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True

DATABASES = {
    'default': {
        'ENGINE': env('DB_ENGINE'),
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': read_secret('DB_PASSWORD', str(env('DB_PASSWORD'))),
        'HOST': env('DB_HOST'),
        'PORT': env('DB_PORT'),
        'ATOMIC_REQUESTS': True
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        "rest_framework.authentication.SessionAuthentication"
    ],
    'DEFAULT_RENDERER_CLASSES': [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer"
    ]
}

# Celery Configuration
CELERY_BROKER_URL = env('CELERY_BROKER_URL')
CELERY_ENABLE_UTC = True
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = env('CELERY_TASK_ALWAYS_EAGER')
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_SEND_TASK_ERROR_EMAILS = True

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
## Celeryd settings
CELERY_WORKER_CONCURRENCY = 1
## Result store settings
CELERY_TASK_IGNORE_RESULT = True
## Celerybeat settings
CELERY_BEAT_SCHEDULER = 'celery.beat.PersistentScheduler'

CELERY_BEAT_SCHEDULE = {
    ## Clears expired sessions
    ## 3:00 a.m.
    "clear_expired_sessions": {
        "task": "oregoninvasiveshotline.tasks.clear_expired_sessions",
        "schedule": crontab(hour=3, minute=0),
    },

    ## Regenerates icons
    ## 3:15 a.m.
    "regenerate_icons": {
        "task": "oregoninvasiveshotline.reports.tasks.generate_icons",
        "schedule": crontab(hour=3, minute=15),
    },
}

# Application-specific configuration
CONTACT_EMAIL = "imapinvasivesoregon@gmail.com"
ITEMS_PER_PAGE = 25
ICON_DEFAULT_COLOR = "#999999"
ICON_DIR = "generated_icons"
ICON_TYPE = "png"

GOOGLE_ANALYTICS_TRACKING_ID = env('GOOGLE_ANALYTICS_TRACKING_ID', default=None)  # pyright: ignore
GOOGLE_API_KEY = read_secret('GOOGLE_API_KEY', str(env('GOOGLE_API_KEY')))

NOTIFICATIONS = {
    'from_email': env('NOTIFICATIONS_FROM_EMAIL'),
    'login_link__subject': "Oregon Invasives Hotline - Login Link",
    'new_report__subject': "Oregon Invasives Hotline - Thank you for your report",
    'notify_new_owner__subject': "A subscription has been assigned to you on Oregon Invasives Hotline",
    'notify_new_submission__subject': "New Oregon Invasives Hotline submission for review",
    'notify_new_comment__subject': "Oregon Invasives Hotline - New Comment on Report",
    'invite_reviewer__subject': "Oregon Invasives Hotline - Submission Review Request"
}

# Configure environment-specific settings
DJANGO_ENV = env('DJANGO_ENV')

if DJANGO_ENV in ['stage', 'staging', 'prod', 'production']:
    # Instruct Django to inspect HTTP header to help determine
    # whether the request was made securely
    ssl_header = str(env('SECURE_PROXY_SSL_HEADER', default='')) # pyright: ignore works at runtime
    if ssl_header:
        header_parts = ssl_header.split(',')
        if len(header_parts) == 2:
            SECURE_PROXY_SSL_HEADER = (header_parts[0].strip(), header_parts[1].strip())

    # Set compatibility password hasher
    PASSWORD_HASHERS.append(
        'oregoninvasiveshotline.hashers.RubyPasswordHasher'
    )

elif DJANGO_ENV in ['dev', 'docker', 'test']:
    # Configure 'INTERNAL_IPS' to support development environments
    import ipaddress

    class CIDRList(object):
        addresses = [
            "127.0.0.0/8",
            "169.254.0.0/16",  # RFC 3927/6890
            "10.0.0.0/8",  # RFC 1918
            "172.16.0.0/12",
            "192.168.0.0/16",
            "fe80::/10",
            "fd00::/8"  # RFC 7436
        ]

        def __init__(self):
            """Create a new ip_network object for each address range provided."""
            self.networks = [
                ipaddress.ip_network(address)
                for address in self.addresses
            ]

        def __contains__(self, address):
            """Check if the given address is contained in any of the networks."""
            return any([
                ipaddress.ip_address(address) in network
                for network in self.networks
            ])

    INTERNAL_IPS = CIDRList()

# Sentry Configuration (if configured)
sentry_dsn = SENTRY_DSN
if sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration

    sentry_sdk.init(
        dsn=str(sentry_dsn),
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
        ],
        environment=SENTRY_ENVIRONMENT, # pyright: ignore
        traces_sample_rate=SENTRY_TRACES_SAMPLE_RATE, # pyright: ignore
        send_default_pii=False
    )

DJANGO_VITE = {
    "default": {
        "dev_mode": DEBUG,
        "dev_server_host": env("DJANGO_VITE_DEV_SERVER_HOST"),
        "dev_server_port": env("DJANGO_VITE_DEV_SERVER_PORT"),
    }
}
# Where ViteJS assets are built.
DJANGO_VITE_ASSETS_PATH = BASE_DIR / "frontend"
# Include DJANGO_VITE_ASSETS_PATH into STATICFILES_DIRS to be copied inside
# when run command python manage.py collectstatic
STATICFILES_DIRS = [DJANGO_VITE_ASSETS_PATH]

INERTIA_LAYOUT = "inertia_base.html"
INERTIA_SSR_URL = inertia_settings.INERTIA_SSR_URL
INERTIA_SSR_ENABLED = inertia_settings.INERTIA_SSR_ENABLED
INERTIA_JSON_ENCODER = inertia_settings.INERTIA_JSON_ENCODER
