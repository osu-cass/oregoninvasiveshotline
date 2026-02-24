export default function Field({
	id,
	label,
	optional,
	children,
}: {
	id: string;
	label: string;
	optional?: boolean;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label htmlFor={id} className="form-label">
				{label}
				{optional && <span className="ms-1 text-muted">(optional)</span>}
			</label>
			{children}
		</div>
	);
}