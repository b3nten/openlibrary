import RootComponent from "./HelloWorld.vue"
import { defineCustomElement } from 'vue';

const name = "ol-hello-world"

if(!customElements.get(name)) {
	customElements.define(
		name,
		defineCustomElement(RootComponent)
	)
}
