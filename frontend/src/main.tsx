import "vite/modulepreload-polyfill";
import type { Page } from "@inertiajs/core";
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

/** Reads the initial page from the inertia-django~=1.2.0 `#app[data-page]` contract. */
function readDjangoInitialPage(): Page {
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

	try {
		return JSON.parse(pagePayload) as Page;
	} catch (error) {
		throw new Error(
			"Inertia bootstrap failed: #app[data-page] payload is invalid JSON.",
			{ cause: error },
		);
	}
}

document.addEventListener("DOMContentLoaded", () => {
	createInertiaApp({
		page: readDjangoInitialPage(),
		http: {
			xsrfCookieName: "csrftoken",
			xsrfHeaderName: "X-CSRFToken",
		},
		resolve: async (name) => {
			const resolvedPage = (await features[`./features/${name}.tsx`]()).default;
			resolvedPage.layout = resolvedPage.layout || Layout;
			return resolvedPage;
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
