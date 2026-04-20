import json
from urllib.request import urlopen

from django.conf import settings
from .types import GoogleReverseGeocodeResponse

def location_in_oregon_or_washington(lat: float, lng: float) -> bool:
    data = get_reverse_geocode(lat, lng)

    results = data["results"]
    for result in results:
        country: str | None = None
        state: str | None = None
        for address in result["address_components"]:
            types = address["types"]

            if "country" in types:
                country = address["short_name"]

            if "administrative_area_level_1" in types:
                state = address["short_name"]

        if country == "US" and state in {"OR", "WA"}:
            return True

    return False

def get_reverse_geocode(lat: float, lng: float) -> GoogleReverseGeocodeResponse:

    # There are some packages that can be used instead of just fetching it directly, but I was not very impressed any of them
    with urlopen(f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={settings.GOOGLE_BACKEND_API_KEY}") as response:
        data = json.load(response)

    return data
