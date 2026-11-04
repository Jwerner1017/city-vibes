import { r as HTTPResponse } from "../_libs/h3+rou3+srvx.mjs";
//#region #nitro/virtual/renderer-template
var rendererTemplate = () => new HTTPResponse("<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover\" />\n    <meta name=\"theme-color\" content=\"#3a9e6e\" />\n    <meta name=\"apple-mobile-web-app-capable\" content=\"yes\" />\n    <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\" />\n    <meta name=\"description\" content=\"City Vibes — Discover family-friendly events, attractions, and things to do in your city\" />\n    <meta property=\"og:title\" content=\"City Vibes — Family Events Near You\" />\n    <meta property=\"og:description\" content=\"The ultimate hyper-local Things To Do app for families across the country\" />\n    <meta property=\"og:type\" content=\"website\" />\n    <link rel=\"apple-touch-icon\" href=\"https://images.unsplash.com/photo-1533042873310-fc15e2e5fbed?w=180&h=180&fit=crop\" />\n    <link rel=\"stylesheet\" href=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css\" />\n    <script src=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.js\" defer><\/script>\n    <title>City Vibes — Family Events Near You</title>\n    <script type=\"module\" src=\"/src/main.jsx\"><\/script>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n  </body>\n</html>\n", { headers: { "content-type": "text/html; charset=utf-8" } });
//#endregion
//#region node_modules/nitro/dist/runtime/internal/routes/renderer-template.mjs
function renderIndexHTML(event) {
	return rendererTemplate(event.req);
}
//#endregion
export { renderIndexHTML as default };
