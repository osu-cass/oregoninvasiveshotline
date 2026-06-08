from collections.abc import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.utils.cache import patch_vary_headers

WEBP_WORKER_CSP = (
    "default-src 'none'; "
    "script-src 'self' 'wasm-unsafe-eval'; "
    "connect-src 'self'"
)


def is_webp_encoder_worker_request(request: HttpRequest) -> bool:
    """Return whether the request targets the WebP encoder worker asset."""
    worker_prefix = f"{settings.STATIC_URL}assets/webpEncoder.worker-"
    return request.path.startswith(worker_prefix) and request.path.endswith(".js")


def webp_worker_csp_middleware(
    get_response: Callable[[HttpRequest], HttpResponse]
) -> Callable[[HttpRequest], HttpResponse]:
    """Apply a narrow WebAssembly CSP only to the WebP encoder worker."""
    def middleware(request: HttpRequest) -> HttpResponse:
        response = get_response(request)
        if is_webp_encoder_worker_request(request):
            response["Content-Security-Policy"] = WEBP_WORKER_CSP
        return response

    return middleware


def precognition_middleware(
    get_response: Callable[[HttpRequest], HttpResponse]
) -> Callable[[HttpRequest], HttpResponse]:
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
