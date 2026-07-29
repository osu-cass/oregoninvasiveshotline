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

type InertiaPageData = NonNullable<
	NonNullable<Parameters<typeof createInertiaApp>[0]>["page"]
>;

import "./main.css";

const features = import.meta.glob<{ default: InertiaPage }>(
	"./features/**/*.tsx",
);

document.addEventListener("DOMContentLoaded", () => {
	// inertia-django renders the page object on <div id="app" data-page>, but
	// Inertia v3 only auto-detects <script data-page="app">, so parse it ourselves.
	const app = document.getElementById("app");
	if (!app?.dataset.page) {
		throw new Error("Inertia page data is missing.");
	}

	const page = JSON.parse(app.dataset.page) as InertiaPageData;

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
