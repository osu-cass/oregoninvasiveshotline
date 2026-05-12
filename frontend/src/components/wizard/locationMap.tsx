import type { MapMouseEvent } from "@vis.gl/react-google-maps";
// Map is a JS keyword, so we have to rename it.
import {
	AdvancedMarker,
	Map as GoogleMap,
	RenderingType,
	useMap,
	useMapsLibrary,
} from "@vis.gl/react-google-maps";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { locationPlacementTypeAtom } from "./atoms";
import LocationErrorDialog from "./locationErrorDialog";
import { LocationPlacementType } from "./types";

type PlaceSelectEvent = Event & {
	placePrediction?: google.maps.places.PlacePrediction;
};

export interface LocationMapProps {
	/** Initial center used when no marker is selected yet. */
	defaultCenter: google.maps.LatLngLiteral;
	/** Current marker position, or null before selection. */
	marker: google.maps.LatLngLiteral | null;
	/** EXIF-based location from uploaded photos, if any. */
	exifLocation?: google.maps.LatLngLiteral;
	/** Optional Google Map style ID. */
	mapId?: string;
	/** Called when the user selects a new map location. */
	onLocationChange: (next: google.maps.LatLngLiteral) => void;
	/** Default zoom level when the map first loads. */
	defaultZoom?: number;
}

/** Interactive location picker with map click, drag pin, search, and geolocation support. */
export default function LocationMap({
	defaultCenter,
	marker,
	exifLocation,
	mapId,
	onLocationChange,
	defaultZoom = 18,
}: LocationMapProps) {
	const map = useMap();
	const placesLibrary = useMapsLibrary("places");
	const [locationPlacementType, setLocationPlacementType] = useAtom(
		locationPlacementTypeAtom,
	);
	const locationRanYet = useRef(false);
	const searchContainerRef = useRef<HTMLDivElement | null>(null);
	const searchInputId = useId();
	const [showLocationErrorDialog, setShowLocationErrorDialog] = useState(false);
	const markerPosition = marker ?? defaultCenter;
	const locationErrorMessage =
		"Unable to retrieve your location. Please allow location access and try again.";

	const onLocationChangeEvent = (latLng: google.maps.LatLngLiteral | null) => {
		if (!latLng) return;
		onLocationChange(latLng);
		setLocationPlacementType(LocationPlacementType.OTHER);
	};

	const changeLocation = (next: google.maps.LatLngLiteral) => {
		if (!map) return;
		onLocationChangeEvent(next);
		map.panTo(next);
	};

	const setToCurrentLocation = (showNotificationInsteadOfPopup?: boolean) => {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setShowLocationErrorDialog(false);
				changeLocation({
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				});
				setLocationPlacementType(LocationPlacementType.GPS);
			},
			() => {
				if (showNotificationInsteadOfPopup) {
					setShowLocationErrorDialog(false);
					toast.error(locationErrorMessage);
				} else {
					setShowLocationErrorDialog(true);
				}
				setLocationPlacementType(LocationPlacementType.OTHER);
				map?.setZoom(6);
			},
		);
	};

	const setToExifLocation = () => {
		if (!exifLocation) return;
		changeLocation(exifLocation);
		setLocationPlacementType(LocationPlacementType.EXIF);
	};

	useEffect(() => {
		if (!map || locationRanYet.current) return;

		if (
			(locationPlacementType === LocationPlacementType.EXIF && exifLocation) ||
			locationPlacementType !== LocationPlacementType.EXIF
		) {
			if (marker) {
				locationRanYet.current = true;
				map.panTo(marker);
				return;
			}
		}

		locationRanYet.current = true;
		if (exifLocation) {
			setToExifLocation();
		} else {
			setToCurrentLocation(true);
		}
	}, [
		map,
		marker,
		// biome-ignore lint/correctness/useExhaustiveDependencies: It does not run on every re-render like this claims
		setToCurrentLocation,
		exifLocation,
		// biome-ignore lint/correctness/useExhaustiveDependencies: It does not run on every re-render like this claims
		setToExifLocation,
		locationPlacementType,
	]);

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
		autocomplete.className = "d-block w-100 border-0 bg-transparent px-3 py-2";
		// @ts-expect-error Placeholder does exist but is missing from types.
		autocomplete.placeholder = "Search for a place...";
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
	}, [
		defaultZoom,
		map,
		placesLibrary,
		searchInputId,
		// biome-ignore lint/correctness/useExhaustiveDependencies: It does not run on every re-render like this claims
		changeLocation,
		// biome-ignore lint/correctness/useExhaustiveDependencies: It does not run on every re-render like this claims
		onLocationChangeEvent,
	]);

	const locationModes = [
		...(exifLocation
			? [
					{
						id: LocationPlacementType.EXIF,
						label: "From photo",
						icon: "bi-image",
						onClick: setToExifLocation,
					},
				]
			: []),
		{
			id: LocationPlacementType.GPS,
			label: "Current location",
			icon: "bi-crosshair",
			onClick: setToCurrentLocation,
		},
		{
			id: LocationPlacementType.OTHER,
			label: "Search",
			icon: "bi-search",
			onClick: () => setLocationPlacementType(LocationPlacementType.OTHER),
		},
	];

	return (
		<div className="d-grid gap-2">
			{/* Location mode toggle group. */}
			<div>
				<p
					className="form-label fw-medium small mb-1 text-body"
					data-label="set-location"
				>
					Set location
				</p>
				<div className="d-flex w-100 flex-column flex-sm-row gap-2">
					{locationModes.map((mode) => (
						<button
							key={mode.id}
							type="button"
							aria-pressed={locationPlacementType === mode.id}
							className={`btn btn-sm w-100 ${
								locationPlacementType === mode.id
									? "btn-secondary"
									: "btn-outline-secondary"
							} d-inline-flex justify-content-center gap-1 align-items-center`}
							onClick={() => mode.onClick(false)}
						>
							<i className={`bi ${mode.icon}`} />
							{mode.label}
						</button>
					))}
				</div>
			</div>

			{/* Search input — only shown when Search mode is active */}
			<div
				className={clsx(
					"d-flex flex-column gap-1 text-body",
					locationPlacementType !== LocationPlacementType.OTHER && "d-none",
				)}
			>
				<label
					htmlFor={searchInputId}
					className="form-label fw-medium small visually-hidden mb-0"
				>
					Search for a place
				</label>
				<div className="form-control p-0" data-bs-theme="light">
					<div ref={searchContainerRef} />
				</div>
				<p className="small mb-0 text-muted">
					Search, click the map, or drag the pin to adjust.
				</p>
			</div>

			<div style={{ height: "360px" }}>
				<GoogleMap
					defaultCenter={defaultCenter}
					defaultZoom={defaultZoom}
					mapId={mapId}
					mapTypeControl
					onClick={(event: MapMouseEvent) => {
						onLocationChangeEvent(event.detail.latLng);
					}}
					keyboardShortcuts={false}
					gestureHandling="cooperative"
					fullscreenControl
					disableDefaultUI
					zoomControl
					renderingType={RenderingType.RASTER}
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

			<LocationErrorDialog
				open={showLocationErrorDialog}
				onOpenChange={setShowLocationErrorDialog}
				description={locationErrorMessage}
			/>
		</div>
	);
}
