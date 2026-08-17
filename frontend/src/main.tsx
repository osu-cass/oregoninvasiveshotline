import "vite/modulepreload-polyfill";
import { createInertiaApp } from "@inertiajs/react";
import type { ComponentType, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import Layout from "./components/layout";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

type InertiaPage = ComponentType & {
	layout?: (page: ReactNode) => ReactNode;
};

import "./main.css";

const features = import.meta.glob<{ default: InertiaPage }>(
	"./features/**/*.tsx",
);

document.addEventListener("DOMContentLoaded", () => {
	const appElement = document.getElementById("app");
	if (!appElement) {
		throw new Error("Inertia bootstrap failed: #app element is missing.");
	}

	const pagePayload = appElement.dataset.page;
	if (!pagePayload) {
		throw new Error(
			"Inertia bootstrap failed: #app[data-page] payload is missing.",
		);
	}

	type InertiaAppOptions = NonNullable<Parameters<typeof createInertiaApp>[0]>;
	type InitialPage = NonNullable<InertiaAppOptions["page"]>;
	let page: InitialPage;
	try {
		page = JSON.parse(pagePayload) as InitialPage;
	} catch (error) {
		throw new Error(
			"Inertia bootstrap failed: #app[data-page] payload is invalid JSON.",
			{ cause: error },
		);
	}

	createInertiaApp({
		page,
		http: {
			xsrfCookieName: "csrftoken",
			xsrfHeaderName: "X-CSRFToken",
		},
		resolve: async (name) => {
			const page = (await features[`./features/${name}.tsx`]()).default;
			page.layout = page.layout || Layout;
			return page;
		},
		setup({ el, App, props }) {
			createRoot(el).render(
				<>
					<App {...props} />
					<Toaster />
				</>,
			);
		},
	});
});
