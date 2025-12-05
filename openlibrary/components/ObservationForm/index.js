import RootComponent from "./ObservationForm.vue"
import { defineCustomElement } from 'vue';

const name = "ol-observation-form"

if(!customElements.get(name)) {
	customElements.define(
		name,
		defineCustomElement(RootComponent)
	)
}
