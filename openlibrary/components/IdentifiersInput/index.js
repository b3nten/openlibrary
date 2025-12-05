import RootComponent from "./IdentifiersInput.vue"
import { defineCustomElement } from 'vue';

const name = "ol-identifiers-input"

if(!customElements.get(name)) {
	customElements.define(
		name,
		defineCustomElement(RootComponent)
	)
}
