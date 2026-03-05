import type { MapMouseEvent } from "@vis.gl/react-google-maps";
// Map is a JS keyword, so we have to rename it.
import {
	AdvancedMarker,
	Map as GoogleMap,
	useMap,
	useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

type PlaceSelectEvent = Event & {
	placePrediction?: google.maps.places.PlacePrediction;
};

export interface LocationMapProps {
	defaultCenter: google.maps.LatLngLiteral;
	marker: google.maps.LatLngLiteral | null;
	mapId?: string;
	onLocationChange: (next: google.maps.LatLngLiteral) => void;
	defaultZoom?: number;
}

export default function LocationMap({
	defaultCenter,
	marker,
	mapId,
	onLocationChange,
	defaultZoom = 7,
}: LocationMapProps) {
	const map = useMap();
	const placesLibrary = useMapsLibrary("places");
	const [isCurrectLocation, setIsCurrectLocation] = useState(false);
	const locationRanYet = useRef(false);
	const searchContainerRef = useRef<HTMLDivElement | null>(null);
	const searchInputId = useId();
	const markerPosition = marker ?? defaultCenter;

	const onLocationChangeEvent = useCallback((latLng: google.maps.LatLngLiteral | null) => {
		if (!latLng) return;
		onLocationChange(latLng);
		setIsCurrectLocation(false);
	}, [onLocationChange])
	
	const changeLocation = useCallback(
		(next: google.maps.LatLngLiteral) => {
			if (!map) return;
			onLocationChangeEvent(next)
			map.panTo(next);
		},
		[map, onLocationChangeEvent],
	);

	const setToCurrentLocation = useCallback(
		() =>
			navigator.geolocation.getCurrentPosition(
				(position) => {
					changeLocation({
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					});
					setIsCurrectLocation(true);
				},
				() => {
					toast.error("Unable to retrieve your location. Please allow location access and try again.");
					setIsCurrectLocation(false);
				},
			),
		[changeLocation],
	);

	useEffect(() => {
		if (!map || locationRanYet.current) return;
		if (marker) {
			locationRanYet.current = true;
			return;
		}
		locationRanYet.current = true;
		setToCurrentLocation();
	}, [map, marker, setToCurrentLocation]);

	useEffect(() => {
		const container = searchContainerRef.current;
		if (!placesLibrary || !container) return;

		const PlaceAutocompleteElement = (
			placesLibrary as typeof placesLibrary & {
				PlaceAutocompleteElement: typeof google.maps.places.PlaceAutocompleteElement;
			}
		).PlaceAutocompleteElement;

		const autocomplete = new PlaceAutocompleteElement({});
		autocomplete.setAttribute("included-region-codes", "us");

		autocomplete.id = searchInputId;
		autocomplete.className = "w-100";
		// @ts-expect-error Placeholder does exist but is missing from types.
		autocomplete.placeholder = "Search for a place...";
		autocomplete.style.display = "block";
		autocomplete.style.width = "100%";
		autocomplete.style.border = "0";
		autocomplete.style.background = "transparent";
		autocomplete.style.padding = "0.375rem 0.75rem";
		autocomplete.style.colorScheme = "light";

		const handleSelection = async (event: PlaceSelectEvent) => {
			const place = event.placePrediction?.toPlace();

			await place?.fetchFields({ fields: ["location", "viewport"] });
			const location = place?.location;
			if (!location) return;

			const next = { lat: location.lat(), lng: location.lng() };
			onLocationChangeEvent(next);
			if (!map) return;

			if (place.viewport) {
				map.fitBounds(place.viewport);
				return;
			}

			changeLocation(next);
			map.setZoom(Math.max(map.getZoom() ?? defaultZoom, 15));
		};
		const handleKeyDown = (event: Event) => {
			event.stopPropagation();
		};

		autocomplete.addEventListener("gmp-select", handleSelection);
		autocomplete.addEventListener("keydown", handleKeyDown);
		container.replaceChildren(autocomplete);

		return () => {
			autocomplete.removeEventListener("gmp-select", handleSelection);
			autocomplete.removeEventListener("keydown", handleKeyDown);
			autocomplete.remove();
		};
	}, [defaultZoom, map, placesLibrary, searchInputId, changeLocation, onLocationChangeEvent]);

	return (
		<div className="d-grid gap-2">
			<div className="d-flex flex-column gap-1 text-body">
				<label
					htmlFor={searchInputId}
					className="form-label fw-medium small mb-0"
				>
					Search for a place
				</label>
				<div className={"form-control p-0"} data-bs-theme="light">
					<div ref={searchContainerRef} />
				</div>
				<p className="small mb-0 text-muted">
					Search for a place, click the map, or drag the pin.
				</p>
			</div>

			<div className="d-flex flex-wrap gap-2">
				<button
					type="button"
					className="btn btn-sm btn-outline-secondary d-inline-flex"
					onClick={setToCurrentLocation}
				>
					Set to current location{" "}
					{isCurrectLocation && (
						<i className="bi bi-check fs-5 lh-1 d-block text-success" />
					)}
				</button>
				{/*<button
					type="button"
					className="btn btn-sm btn-outline-secondary"
					onClick={() => {
						onLocationChangeRef.current(defaultCenter);
						focusMap(defaultCenter);
					}}
				>
					Set to EXIF
				</button>*/}
			</div>

			<div style={{ height: "360px" }}>
				<GoogleMap
					defaultCenter={defaultCenter}
					defaultZoom={defaultZoom}
					mapId={mapId}
					onClick={(event: MapMouseEvent) => {
						onLocationChangeEvent(event.detail.latLng);
					}}
					keyboardShortcuts={false}
					gestureHandling="cooperative"
					fullscreenControl
					disableDefaultUI
				>
					{marker && (
						<AdvancedMarker
							position={markerPosition}
							onDragEnd={(event: google.maps.MapMouseEvent) => {
								const latLng = event.latLng;
								if (!latLng) return;
								onLocationChangeEvent({ lat: latLng.lat(), lng: latLng.lng() });
							}}
						/>
					)}
				</GoogleMap>
			</div>
		</div>
	);
}
