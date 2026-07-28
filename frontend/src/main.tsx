import "vite/modulepreload-polyfill";
import { createInertiaApp } from "@inertiajs/react";
import axios from "axios";
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
	const app = document.getElementById("app");
	if (!app?.dataset.page) {
		throw new Error("Inertia page data is missing.");
	}

	const page = JSON.parse(app.dataset.page) as InertiaPageData;

	axios.defaults.xsrfCookieName = "csrftoken";
	axios.defaults.xsrfHeaderName = "X-CSRFToken";

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
