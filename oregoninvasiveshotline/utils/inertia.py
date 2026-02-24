from django.forms import Form
from django.http import HttpRequest, HttpResponse, JsonResponse

def inertia_location(url: str) -> HttpResponse:
	return HttpResponse(
        status=409,
        headers={"X-Inertia-Location": url},
    )

def is_precognition(request: HttpRequest) -> bool:
	return "Precognition" in request.headers

def parse_precognition_fields(request: HttpRequest, form: Form) -> HttpResponse:
    fields_to_validate_header = request.headers.get("Precognition-Validate-Only", "")
    fields = [field.strip() for field in fields_to_validate_header.split(",") if field.strip()]
    form.full_clean()
    errors = {}
    for k, v in form.errors.items():
        if k in fields:
            errors[k] = list(v)

    if errors:
        response = JsonResponse({"errors": errors}, status=422)
        response["Precognition"] = "true"
        return response
    response = HttpResponse(status=204)
    response["Precognition"] = "true"
    response["Precognition-Success"] = "true"
    return response
