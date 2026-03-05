import { APIProvider } from "@vis.gl/react-google-maps";
import { useCallback, useMemo } from "react";
import Field from "../forms/field";
import LocationMap from "./location-map";
import type { WizardStepProps } from "./types";

const defaultCenter = { lat: 44, lng: -120.578333 };

interface StepThreeProps extends WizardStepProps {
	/** Google Maps API key for the map. */
	googleApiKey?: string;
	/** Google Map ID for advanced marker support. */
	googleMapId?: string;
}

/** Step 3: Location details and map pin. */
export default function StepThree({
	form,
	googleApiKey,
	googleMapId,
}: StepThreeProps) {
	const locationError = form.invalid("latitude")
		? form.errors.latitude
		: undefined;

	const marker = useMemo(() => {
		const lat = Number.parseFloat(form.data.latitude);
		const lng = Number.parseFloat(form.data.longitude);
		if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
		return { lat, lng };
	}, [form.data.latitude, form.data.longitude]);

	const saveLocation = useCallback(
		(next: google.maps.LatLngLiteral) => {
			form.setData("latitude", String(next.lat));
			form.setData("longitude", String(next.lng));
			form.clearErrors("latitude", "longitude");
		},
		[form],
	);

	return (
		<div className="row g-3 mt-1">
			<div className="col-12">
				{googleApiKey ? (
					<APIProvider apiKey={googleApiKey} libraries={["places"]}>
						<LocationMap
							defaultCenter={defaultCenter}
							defaultZoom={7}
							mapId={googleMapId}
							marker={marker}
							onLocationChange={(next) => {
								saveLocation(next);
							}}
						/>
					</APIProvider>
				) : (
					<div className="alert alert-warning mb-0">
						Google Maps API key missing. Add GOOGLE_API_KEY to enable the map.
					</div>
				)}
				{locationError && (
					<div className="invalid-feedback d-block">{locationError}</div>
				)}
				<div className="d-flex small mt-2 gap-3 text-muted">
					<span>Lat: {marker ? marker.lat.toFixed(6) : "--"}</span>
					<span>Lng: {marker ? marker.lng.toFixed(6) : "--"}</span>
				</div>
			</div>

			<div className="col-12">
				<Field
					form={form}
					name="location_description"
					label="Where it was found (site details)"
					as="textarea"
					textareaProps={{
						rows: 4,
						placeholder:
							"Add context for the location, like nearby landmarks or access points, and where in the area it was (ditch, fence line, field edge, along water)",
					}}
				/>
			</div>
		</div>
	);
}
