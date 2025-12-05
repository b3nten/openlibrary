/* eslint-env node, es6 */
import legacy from "@vitejs/plugin-legacy";
import vue from "@vitejs/plugin-vue";
import { dirname, join } from "path";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const BUILD_DIR = process.env.BUILD_DIR || "static/build/components";
const THIS_DIR = dirname(fileURLToPath(import.meta.url))

/** @type {Record<string, string>} */
const vueComponents = [
	"BarcodeScanner",
	"BulkSearch",
	"HelloWorld",
	"IdentifiersInput",
	"LibraryExplorer",
	"MergeUI",
	"ObservationForm",
].reduce((result, component) => {
	result[component] = `${join(THIS_DIR, component)}`;
	return result;
}, {})

export default defineConfig({
  plugins: [
    devRepl(),
    vue({ customElement: true }),
    legacy({
      targets: ["defaults", "not IE 11"],
      modernPolyfills: true,
    }),
  ],
  build: {
    outDir: join(BUILD_DIR, "/production"),
    rollupOptions: {
			input: {
				...vueComponents,
				"components": join(THIS_DIR, "components.entry")
			},
      output: {
        entryFileNames: "ol-[name].js",
        format: "es",
      },
    },
  },
  minify: "terser",
  sourcemap: true,
});

/**
 * Creates a repl environment for development, sharing the same
 * build settings as with production builds.
 * todo: provide a way to add children & attributes for testing.
 * todo: optionally enable HMR for Vue components (no wc wrapper)
 * @returns { import("vite").Plugin }
 */
function devRepl() {
  return {
    name: "ol-dev-repl",
    configureServer(s) {
      // middleware registered in a returned callback are registered after Vite's internal middleware
      // this serves the dev.html file and adds component imports and a list of component tags to the file
      return () => {
        s.middlewares.use(async (_, res) => {
          let template = readFileSync("./dev.html", "utf-8");

          const allComponentImports = Object.values(vueComponents)
          	.concat(join(THIS_DIR, "components.entry"))
           	.map((it) => `import "${it}"`)
            .join(";");

          template = template.replace(
            "<!-- head -->",
            `<script type='module'>${allComponentImports}</script>`,
          );

          const html = await s.transformIndexHtml("/", template);

          res.writeHead(200, { "Content-Type": "text/html" }).end(html);
        });
      };
    },
  };
}
