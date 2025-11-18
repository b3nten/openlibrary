import { defineCustomElement } from 'vue';
import AsyncComputed from 'vue-async-computed';

export const wrapVueComponent = (rootComponent, name) => {
    // This is the name we use in the DOM like: <ol-barcode-scanner></ol-barcode-scanner>
    const elementName = `ol-${name}`;

    const WebComponent = defineCustomElement(rootComponent, {
        configureApp(app) {
            if (elementName === 'ol-merge-ui') {
                app.use(AsyncComputed);
            }
        },
    });

    if (!customElements.get(elementName)) {
        customElements.define(elementName, WebComponent);
    }
};
