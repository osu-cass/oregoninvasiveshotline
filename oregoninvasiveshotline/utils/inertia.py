import json
import logging
from typing import Any, Mapping

from django.forms import Form
from django.http import HttpRequest, HttpResponse, JsonResponse, QueryDict

logger = logging.getLogger(__name__)

def inertia_location(url: str) -> HttpResponse:
    return HttpResponse(
        status=409,
        headers={"X-Inertia-Location": url},
    )


def is_precognition(request: HttpRequest) -> bool:
    return "Precognition" in request.headers


def get_post_data(request: HttpRequest) -> QueryDict | dict[str, Any]:
    """Return POST data from either form-encoded or JSON request bodies.

    Precognition sends JSON when the payload has no files. Django only
    populates request.POST for multipart and form-urlencoded bodies, so
    we need to parse JSON manually. Checking request.POST first avoids
    touching request.body after multipart parsing consumes the stream.
    """
    if request.POST:
        return request.POST
    try:
        return json.loads(request.body)
    except:
        logger.warning("An inertia request was not properly processed.")
        return {}
        

def collect_indexed(source: Mapping[str, object], prefix: str) -> list:
    """Collect values sent with Inertia's indexed array format.

    Inertia serializes arrays as prefix[0], prefix[1], etc. Django treats
    each as a literal key name, so we gather matching keys into a list.

    Inertia sends something like this that needs to be reassembled into a more usable form:
    {
        "images[0]": <UploadedFile>,
        "images[1]": <UploadedFile>,
        "images[2]": <UploadedFile>,
        "image_captions[0]": "My first photo",
        "image_captions[1]": "",
        "image_captions[2]": "Another one",
        "find_description": "Saw something weird...",
        ...
    }

    Works with both request.POST (QueryDict) and request.FILES (MultiValueDict).
    """
    tag = prefix + "["
    indexed: list = []
    
    # Theoretically the keys should all be in perfect order/have no gaps, but this makes the code a little less brittle than a simple loop.
    for key, value in source.items():
        if key.startswith(tag):
            index = key[len(tag):-1]
            if (index.isdigit()):
                i = int(index)
                while len(indexed) <= i:
                    indexed.append(None)
                
                indexed[i] = value
        
    return indexed


def parse_precognition_fields(request: HttpRequest, form: Form) -> HttpResponse:
    """Validate specific fields for a precognition request and return errors."""
    header = request.headers.get("Precognition-Validate-Only", "")
    fields = [f.strip() for f in header.split(",") if f.strip()]

    form.full_clean()
    errors = {k: list(v) for k, v in form.errors.items() if k in fields}

    if errors:
        response = JsonResponse({"errors": errors}, status=422)
        response["Precognition"] = "true"
        return response

    response = HttpResponse(status=204)
    response["Precognition"] = "true"
    response["Precognition-Success"] = "true"
    return response
