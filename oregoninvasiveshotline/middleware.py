from collections.abc import Callable

from django.http import HttpRequest, HttpResponse
from django.utils.cache import patch_vary_headers

def precognition_middleware(get_response: Callable[[HttpRequest], HttpResponse]) -> Callable[[HttpRequest], HttpResponse]:
    """Add the Precognition header to response vary metadata.

    Args:
        get_response: Downstream Django request handler.

    Returns:
        Callable[[HttpRequest], HttpResponse]: Middleware function that patches vary headers.
    """
    def middleware(request: HttpRequest) -> HttpResponse:
        response = get_response(request)
        patch_vary_headers(response, ('Precognition',))
        return response

    return middleware
