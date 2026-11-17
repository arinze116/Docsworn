import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const root = path.dirname(fileURLToPath(import.meta.url));
const page = await readFile(path.join(root, "index.html"));

createServer((request, response) => {
  if (request.url === "/" || request.url === "/register") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(page);
    return;
  }
  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("Not found");
}).listen(port, "127.0.0.1", () => {
  console.log(`Fixture app: http://127.0.0.1:${port}/register`);
});
