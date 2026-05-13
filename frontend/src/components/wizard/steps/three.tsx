import { APIProvider } from "@vis.gl/react-google-maps";
import Field from "../../forms/field";
import LocationMap from "../locationMap";
import type { WizardStepProps } from "../types";

const defaultCenter = { lat: 44, lng: -120.578333 };

interface StepThreeProps extends WizardStepProps {
	/** EXIF-based location from uploaded photos, if any. */
	exifLocation?: google.maps.LatLngLiteral;
	/** Whether any images are currently attached. */
	hasImages?: boolean;
	/** Google Maps API key for the map. */
	googleApiKey?: string;
	/** Google Map ID for advanced marker support. */
	googleMapId?: string;
}

/** Step 3: Location details and map pin. */
export default function StepThree({
	form,
	exifLocation,
	hasImages,
	googleApiKey,
	googleMapId,
}: StepThreeProps) {
	const locationError = form.invalid("latitude")
		? form.errors.latitude
		: undefined;

	const lat = Number.parseFloat(form.data.latitude);
	const lng = Number.parseFloat(form.data.longitude);
	const marker: google.maps.LatLngLiteral | null =
		Number.isNaN(lat) || Number.isNaN(lng) ? null : { lat, lng };

	return (
		<div className="row g-3 mt-1">
			<div className="col-12">
				{googleApiKey ? (
					<APIProvider apiKey={googleApiKey} libraries={["places"]}>
						<LocationMap
							defaultCenter={defaultCenter}
							exifLocation={hasImages ? exifLocation : undefined}
							mapId={googleMapId}
							marker={marker}
							onLocationChange={(next) => {
								form.setData("latitude", String(next.lat));
								form.setData("longitude", String(next.lng));
								form.clearErrors("latitude", "longitude");
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
					label="Anything else you can tell us about where you found this?"
					as="textarea"
					textareaProps={{
						rows: 4,
						placeholder:
							"Note where in the area you spotted it (ditch, fence line, field edge, along water), any hazards nearby (power lines, soft ground, locked gates), and landmarks or access points.",
					}}
				/>
			</div>
		</div>
	);
}
