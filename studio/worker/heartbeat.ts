/**
 * heartbeat.ts — HTTP mínimo del servicio hermes-worker para el healthcheck de Railway.
 * No recibe trabajos ni secretos: solo dice que el proceso sigue vivo.
 */
import * as http from "http";

export function createHeartbeatServer(): http.Server {
  return http.createServer((req, res) => {
    const path = (req.url || "/").split("?")[0];
    const ok = (req.method === "GET" || req.method === "HEAD") && (path === "/heartbeat" || path === "/health");
    if (!ok) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false }));
      return;
    }
    const body = JSON.stringify({ ok: true });
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
      "Cache-Control": "no-store",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  });
}

export function startHeartbeat(port: number): Promise<http.Server> {
  const server = createHeartbeatServer();
  return new Promise((resolve, reject) => {
    const onError = (err: Error) => {
      server.off("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve(server);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "0.0.0.0");
  });
}
