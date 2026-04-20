from typing import TypedDict, NotRequired

# Some typings based on the api response to make parsing it easier

class PlusCode(TypedDict):
    compound_code: str
    global_code: str


class LatLng(TypedDict):
    lat: float
    lng: float


class NavigationLatLng(TypedDict):
    latitude: float
    longitude: float


class LatLngBounds(TypedDict):
    northeast: LatLng
    southwest: LatLng


class Geometry(TypedDict):
    location: LatLng
    location_type: str
    viewport: LatLngBounds
    bounds: NotRequired[LatLngBounds]


class NavigationPoint(TypedDict):
    location: NavigationLatLng


class AddressComponent(TypedDict):
    long_name: str
    short_name: str
    types: list[str]


class GeocodeResult(TypedDict):
    address_components: list[AddressComponent]
    formatted_address: str
    geometry: Geometry
    place_id: str
    types: list[str]
    navigation_points: NotRequired[list[NavigationPoint]]
    plus_code: NotRequired[PlusCode]


class GoogleReverseGeocodeResponse(TypedDict):
    results: list[GeocodeResult]
    status: str
    plus_code: NotRequired[PlusCode]
    
