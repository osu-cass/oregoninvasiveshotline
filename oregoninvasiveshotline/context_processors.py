from sentry_sdk import Hub

from django.conf import settings

from oregoninvasiveshotline import __version__


def defaults(request):
    # If the current Sentry span is defined, supply the attached
    # attached trace_id to the template context.
    # 
    # This value allows a sentinel header to be set which allows
    # traces to span the frontend/backend boundary.
    trace_id = None
    if Hub.current.scope.span is not None:
        trace_id = Hub.current.scope.span.trace_id

    return {
        'CONTACT_EMAIL': settings.CONTACT_EMAIL,
        'GOOGLE_API_KEY': settings.GOOGLE_API_KEY,

        'ENVIRONMENT': settings.ENV,
        'RELEASE': __version__,
        'TRACE_ID': trace_id,
        'SENTRY_DSN': getattr(settings, 'SENTRY_DSN', ''),
        'SENTRY_TRACES_SAMPLE_RATE': getattr(settings, 'SENTRY_TRACES_SAMPLE_RATE', 0.1)
    }
