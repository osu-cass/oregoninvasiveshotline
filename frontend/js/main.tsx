import "vite/modulepreload-polyfill";
import { createInertiaApp } from "@inertiajs/react";
import axios from "axios";
import { createRoot } from "react-dom/client";
import Layout from "./components/Layout";

import "../css/main.css";

const pages = import.meta.glob("./pages/**/*.tsx");

document.addEventListener("DOMContentLoaded", () => {
	axios.defaults.xsrfCookieName = "csrftoken";
	axios.defaults.xsrfHeaderName = "X-CSRFToken";

	createInertiaApp({
		resolve: async (name) => {
			const page = (await pages[`./pages/${name}.tsx`]()).default;
			page.layout = page.layout || Layout;
			return page;
		},
		setup({ el, App, props }) {
			createRoot(el).render(<App {...props} />);
		},
	});
});
