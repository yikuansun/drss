import terser from "@rollup/plugin-terser";

export default {
    input: "src/index.js",
    output: {
        file: "dist/rss.min.js",
        format: "umd",
        name: "RSS",
        plugins: [
            terser()
        ],
    },
};