import http from "http";
import { render } from "@lit-labs/ssr";
import { html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

// todo: import components we want to SSR here (not all will require it)
import '../Button/Button.lit.js';

const server = http.createServer((req, res) => {
  if (req.method === "POST") {
  	const t = performance.now()
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
      	for(const chunk of render(html`${unsafeHTML(body)}`)) {
       		if(typeof chunk !== "string") {
         		throw Error("Async components are unsupported")
         	}
       		res.write(chunk)
       	}
        res.end(`<!-- lit rendered in ${performance.now() - t} -->`)
      } catch (error) {
        res.writeHead(400);
        res.end();
      }
    });
  } else {
    res.writeHead(405);
    res.end();
  }
});

console.log(`Lit SSR server running on port 8010`);
server.listen(8010);
