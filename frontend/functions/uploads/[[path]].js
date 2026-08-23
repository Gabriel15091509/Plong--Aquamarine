// Proxy transparent /uploads/* -> passerelle Render, TOUTES méthodes HTTP.
// Voir functions/api/[[path]].js pour le contexte complet (même limite
// _redirects contournée, même mécanisme).
const GATEWAY_URL = "https://aquanature-gateway.onrender.com";

export async function onRequest(context) {
  const { request, params } = context;
  const path = Array.isArray(params.path) ? params.path.join("/") : (params.path || "");
  const url = new URL(request.url);
  const target = `${GATEWAY_URL}/uploads/${path}${url.search}`;

  const proxied = new Request(target, {
    method: request.method,
    headers: request.headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
  });

  return fetch(proxied);
}
