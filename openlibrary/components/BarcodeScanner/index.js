import RootComponent from "./BarcodeScanner.vue"
import { defineCustomElement } from 'vue';

const name = "ol-barcode-scanner"

if(!customElements.get(name)) {
	customElements.define(
		name,
		defineCustomElement(RootComponent)
	)
}
