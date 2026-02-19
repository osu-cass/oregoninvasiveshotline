import { useAtom } from "jotai";
import { Steps } from "../components/wizard-steps";
import { stepAtom } from "../components/wizard-steps/atoms";

export default function FormWizard() {
	const [step, setStep] = useAtom(stepAtom);
	const Component = Steps[step]?.component;

	return (
		<div>
			<div className="row justify-content-center">
				<div className="col-12 col-lg-6 col-md-8">
					<div
						className="progress"
						role="progressbar"
						aria-label="Example 1px high"
						aria-valuenow={25}
						aria-valuemin={0}
						aria-valuemax={100}
						style={{ height: "0.5rem" }}
					>
						<div
							className="progress-bar"
							style={{ width: `${(step / Steps.length) * 100}%` }}
						></div>
					</div>
					<form>
						{Component ? <Component /> : <div>submitted</div>}
						<div className="d-flex justify-content-end gap-2">
							{step !== 0 && (
								<button
									type="button"
									className="btn btn-secondary px-4"
									style={{ width: "5rem" }}
									onClick={() => setStep((step) => step - 1)}
								>
									Back
								</button>
							)}

							<button
								type="button"
								className="btn btn-primary"
								onClick={() => setStep((step) => Math.min(step + 1, Steps.length))}
								style={{ width: "5rem" }}
							>
								{step === Steps.length - 1 ? "Submit" : "Next"}
							</button>
						</div>
						{step}
					</form>
				</div>
			</div>
		</div>
	);
}
