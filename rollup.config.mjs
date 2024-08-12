import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.js",
  output: {
    file: "dist/drss.min.js",
    format: "umd",
    name: "DRSS",
    plugins: [terser()],
  },
};
