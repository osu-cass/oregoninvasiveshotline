import { Form, useForm, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";

interface PageIndexProps {
	authenticated: boolean;
}

export default function Index({ authenticated }: PageIndexProps) {
	const props = usePage().props
	const { data, setData, post, processing, errors } = useForm({
		name: '',
		state: '',
	})

	const submitted = useMemo(() => Boolean(Object.keys(errors).length), [errors]);

	function submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		post('/test/')
	}

	return (
		<div
			className="container"
			style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}
		>
			<form
				className="row g-3"
				noValidate
				onSubmit={submit}
			>
				<div className="col-md-6">
					<label htmlFor="validationServerName" className="form-label">Name</label>
					<input
						type="text"
						className={`form-control ${submitted ? (errors.name ? 'is-invalid' : 'is-valid') : ''}`}
						id="validationServerName"
						value={data.name}
						onChange={e => setData('name', e.target.value)}
						aria-describedby={errors.name ? "validationServerNameFeedback" : undefined}
						required
					/>
					{submitted && errors.name && (
						<div id="validationServerNameFeedback" className="invalid-feedback">
							{errors.name}
						</div>
					)}
					{/*{submitted && !errors.name && data.name && (
						<div className="valid-feedback">
							Looks good!
						</div>
					)}*/}
				</div>

				<div className="col-md-6">
					<label htmlFor="validationServerState" className="form-label">State</label>
					<select
						className={`form-select ${submitted ? (errors.state ? 'is-invalid' : 'is-valid') : ''}`}
						id="validationServerState"
						value={data.state}
						onChange={e => setData('state', e.target.value)}
						aria-describedby={errors.state ? "validationServerStateFeedback" : undefined}
						required
					>
						<option value="">Choose...</option>
						<option value="OR">Oregon</option>
						<option value="WA">Washington</option>
						<option value="CA">California</option>
					</select>
					{submitted && errors.state && (
						<div id="validationServerStateFeedback" className="invalid-feedback">
							{errors.state}
						</div>
					)}
					{submitted && !errors.state && data.state && (
						<div className="valid-feedback">
							Looks good!
						</div>
					)}
				</div>

				<div className="col-12">
					<button type="submit" className="btn btn-primary" disabled={processing}>
						Submit form
					</button>
				</div>
			</form>
			<div style={{ marginTop: "2rem" }}>
				<strong>Debug errors:</strong> {JSON.stringify(errors)}
			</div>
		</div>
	);
}
