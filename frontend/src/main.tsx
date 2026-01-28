import "vite/modulepreload-polyfill";
import { createInertiaApp } from "@inertiajs/react";
import axios from "axios";
import type { ComponentType, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import Layout from "./components/layout";
import "bootstrap/dist/css/bootstrap.min.css";

type InertiaPage = ComponentType & {
	layout?: (page: ReactNode) => ReactNode;
};

import "./main.css";

const features = import.meta.glob<{ default: InertiaPage }>(
	"./features/**/*.tsx",
);

document.addEventListener("DOMContentLoaded", () => {
	axios.defaults.xsrfCookieName = "csrftoken";
	axios.defaults.xsrfHeaderName = "X-CSRFToken";

	createInertiaApp({
		resolve: async (name) => {
			const page = (await features[`./features/${name}.tsx`]()).default;
			page.layout = page.layout || Layout;
			return page;
		},
		setup({ el, App, props }) {
			createRoot(el).render(<App {...props} />);
		},
	});
});
