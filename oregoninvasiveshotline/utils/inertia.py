from django.http import HttpResponse

def inertia_location(url: str) -> HttpResponse:
	return HttpResponse(
        status=409,
        headers={"X-Inertia-Location": url},
    )