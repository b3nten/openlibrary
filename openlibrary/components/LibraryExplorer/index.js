import RootComponent from "./LibraryExplorer.vue"
import { defineCustomElement } from 'vue';

const name = "ol-library-explorer"

if(!customElements.get(name)) {
	customElements.define(
		name,
		defineCustomElement(RootComponent)
	)
}
