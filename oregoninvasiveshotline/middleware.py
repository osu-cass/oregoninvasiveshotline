from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

def precognition_middleware(get_response: Callable[[HttpRequest], HttpResponse]) -> Callable[[HttpRequest], HttpResponse]:
    def middleware(request: HttpRequest) -> HttpResponse:
        response = get_response(request)
        response["Vary"] = "Precognition"
        return response

    return middleware
