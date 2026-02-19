import type { ComponentType } from "react";
import StepOne from "./one";
import StepTwo from "./two";

interface Step {
	title: string;
	component: ComponentType;
}

export const Steps: Step[] = [
	{
		title: "Photo and Submission",
		component: StepOne,
	},
	{
		title: "Smth else here",
		component: StepTwo,
	},
];
