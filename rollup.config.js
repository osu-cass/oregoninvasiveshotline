import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import terser from "@rollup/plugin-terser";

export default {
    input: "index.js", // entry point
    output: {
        dir: "oregoninvasiveshotline/static",
        entryFileNames: "js/index.js", // Django will serve this
        format: "iife", // self-executing function for browsers
        name: "App",
        globals: {
            "choices.js": "Choices",
            "js-cookie": "Cookies",
        },
    },
    external: ['choices.js', 'js-cookie'],
    plugins: [
        resolve(),
        commonjs(),
        postcss({
            extract: "css/index.css",
            minimize: true,
        }),
        terser(),
    ],
};
