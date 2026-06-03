NO_VALUE = object()


DEFAULT_SETTINGS = {
    'allow_staff': False,
    'allow_superuser': False,
    'allow_anonymous': False,
    'unauthenticated_handler': None,

    # django.http.HttpRequest is always included.
    # rest_framework.request.Request is always included when DRF is
    # installed.
    'request_types': (),
}


def _default(v, default):
    if v is None:
        return default
    return v
