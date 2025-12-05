import RootComponent from "./BulkSearch.vue"
import { defineCustomElement } from 'vue';

const name = "ol-bulk-search"

if(!customElements.get(name)) {
	customElements.define(
		name,
		defineCustomElement(RootComponent)
	)
}
