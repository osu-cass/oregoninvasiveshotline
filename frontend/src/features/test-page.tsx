import { Form, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";

interface PageIndexProps {
	authenticated: boolean;
}

export default function Index({ authenticated }: PageIndexProps) {
	const props = usePage().props
	const { data, setData, post, processing, errors } = useForm({
    name: '',
})

	// const submit = (e: React.FormEvent<HTMLFormElement>) => {
	// 	const form = e.currentTarget;
	// 	e.preventDefault();
 //    if (form.checkValidity() === false) {

 //      e.stopPropagation();
 //    }
 //    // setValidated(true)
	// };

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
				className={`row g-3 ${true ? "was-validated" : "needs-validation"}`}
				noValidate
				onSubmit={submit}
			>
				<input type="text" value={data.name} onChange={e => setData('name', e.target.value)} />
        {errors.name && <div>{errors.name}</div>}
				<button type="submit" className="btn btn-primary">
					Submit
				</button>
			</form>
			{JSON.stringify(errors)}
		</div>
	);
}
