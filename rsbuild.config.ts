import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';


export default defineConfig({
	plugins: [
		pluginReact(),
		pluginTypeCheck({
			enable: true,
			tsCheckerOptions: {
				devServer: false
			}
		})
	],
	html: {
		template: "./index.html",
	},
	source: {
		entry: {
			index: "./demo/index.tsx",
		},
	},
	resolve: {
		alias: {
			"@": ".",
		},
	},
	output: {
		distPath: {
			root: "dist-demo",
		},
	},
});