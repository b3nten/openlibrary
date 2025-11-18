/* eslint-env node, es6 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import legacy from "@vitejs/plugin-legacy";
import { readdirSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const BUILD_DIR = process.env.BUILD_DIR || "static/build/components";
const THIS_DIR = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/guide/api-plugin#virtual-modules-convention
const VUE_VIRTUAL_PREFIX = "virtual:vue/";
const LIT_VIRTUAL_PREFIX = "virtual:lit";

export default defineConfig({
  plugins: [
    moduleResolution(),
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
 * @returns { import("vite").Plugin }
 */
function moduleResolution() {
  return {
    name: "ol-mod-resolution",
    config(c) {
      // create config objects if not exist
      c.build.rollupOptions ??= {};
      c.build.rollupOptions.input ??= {};

      // add Vue components as entries
      resolveVueComponents()
        .map((name) => name.replace(".vue", ""))
        .forEach((name) => {
          c.build.rollupOptions.input[name] = VUE_VIRTUAL_PREFIX + name;
        });

      // input for Lit bundle
      c.build.rollupOptions.input.components = LIT_VIRTUAL_PREFIX;
    },
    resolveId(id) {
      // we need this step to let Vite know that we have resolved the virtual module
      if (
        id.startsWith(VUE_VIRTUAL_PREFIX) ||
        id.startsWith(LIT_VIRTUAL_PREFIX)
      ) {
        // convention: https://vite.dev/guide/api-plugin#virtual-modules-convention
        return "\0" + id;
      }
    },
    load(id) {
      if (id.startsWith("\0" + VUE_VIRTUAL_PREFIX)) {
        const componentName = id.replace("\0" + VUE_VIRTUAL_PREFIX, "");
        return `
       		import { wrapVueComponent } from '${THIS_DIR}/wrapVue.js';
         	import rootComponent from '${THIS_DIR}/${componentName}.vue';
          wrapVueComponent(rootComponent, '${toKebabCase(componentName)}');
        `;
      }
      if (id.startsWith("\0" + LIT_VIRTUAL_PREFIX)) {
        // simply import all lit components
        return resolveLitComponents()
          .map((it) => `import "${join(THIS_DIR, it)}"`)
          .join(";");
      }
    },
  };
}

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

          // import all components into the playground to register them, using the
          // virtual module prefix which will let vite build them as web components
          const allComponentImports = resolveVueComponents()
            .map((it) => it.replace(".vue", ""))
            .map((it) => VUE_VIRTUAL_PREFIX + it)
            .concat(LIT_VIRTUAL_PREFIX)
            .map((it) => `import "${it}"`)
            .join(";");

          template = template.replace(
            "<!-- head -->",
            `<script type='module'>${allComponentImports}</script>`,
          );

          // get all tag names so we can provide a select UI
          const tagNames = [
            ...resolveVueComponents().map((it) => it.replace(".vue", "")),
            ...resolveLitComponents().map((it) => it.replace(/\.lit\.(js|ts)$/, "")),
          ].map(toKebabCase);

          template = template.replace(
            "<!-- body -->",
            `<component-repl components='${JSON.stringify(tagNames)}'></component-repl>`,
          );

          const html = await s.transformIndexHtml("/", template);

          res.writeHead(200, { "Content-Type": "text/html" }).end(html);
        });
      };
    },
  };
}

/** @param str {string} */
const toKebabCase = (str) =>
  str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

// returns a list of vue component relative paths
const resolveVueComponents = () =>
  readdirSync(THIS_DIR).filter((it) => it.includes(".vue"));

// returns a list of lit component relative paths
const resolveLitComponents = () =>
  readdirSync(THIS_DIR).filter((it) => it.includes(".lit."));
