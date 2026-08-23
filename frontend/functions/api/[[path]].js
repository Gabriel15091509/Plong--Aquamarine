// Proxy transparent /api/* -> passerelle Render, TOUTES méthodes HTTP.
//
// _redirects (status 200, "proxy" vers une URL externe) ne relaie que
// GET/HEAD sur Cloudflare Pages -- contrairement à Netlify, qui proxifiait
// aussi POST/PUT/DELETE/PATCH de la même façon. Constaté en prod le
// 2026-08-23 : /api/health (GET) passait, /api/auth/login (POST) renvoyait
// 405 alors que la passerelle elle-même répondait correctement en direct.
// Une Pages Function n'a pas cette limite : elle relaie l'intégralité de la
// requête (méthode, headers, corps) via fetch(), comme le ferait n'importe
// quel reverse proxy applicatif.
//
// ⚠️ Garder GATEWAY_URL synchronisé avec celui de functions/uploads/[[path]].js
// et avec render.yaml si le nom du service Render change un jour.
const GATEWAY_URL = "https://aquanature-gateway.onrender.com";

export async function onRequest(context) {
  const { request, params } = context;
  const path = Array.isArray(params.path) ? params.path.join("/") : (params.path || "");
  const url = new URL(request.url);
  const target = `${GATEWAY_URL}/api/${path}${url.search}`;

  const proxied = new Request(target, {
    method: request.method,
    headers: request.headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
  });

  return fetch(proxied);
}
