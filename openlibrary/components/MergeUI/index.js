import MergeUI from "./MergeUI.vue"
import { defineCustomElement } from 'vue';
import AsyncComputed from 'vue-async-computed';

const name = "ol-merge-ui";

if (!customElements.get(name)) {
	customElements.define(
		name,
		defineCustomElement(MergeUI, {
			configureApp(app) {
				app.use(AsyncComputed);
			},
		})
	)
}
