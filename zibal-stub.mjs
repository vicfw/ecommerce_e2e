import http from "node:http";

const PORT = 4010;
const HOST = "127.0.0.1";

/** @type {Map<string, string | number>} */
const trackToOrderId = new Map();
let nextTrackId = 1_000_001;

const readJson = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
};

const sendJson = (res, status, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && pathname === "/v1/request") {
    const body = await readJson(req);
    const trackId = nextTrackId++;
    trackToOrderId.set(String(trackId), body.orderId);
    sendJson(res, 200, {
      result: 100,
      message: "success",
      trackId,
    });
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/v1/track/")) {
    const trackId = pathname.slice("/v1/track/".length);
    const orderId = trackToOrderId.get(trackId);
    if (orderId === undefined) {
      sendJson(res, 404, { result: 0, message: "track not found" });
      return;
    }
    sendJson(res, 200, { orderId, trackId });
    return;
  }

  if (req.method === "POST" && pathname === "/v1/verify") {
    const body = await readJson(req);
    const trackId = String(body.trackId ?? "");
    const orderId = trackToOrderId.get(trackId);
    if (orderId === undefined) {
      sendJson(res, 200, { result: 0, message: "track not found" });
      return;
    }
    sendJson(res, 200, { result: 100, orderId });
    return;
  }

  sendJson(res, 404, { result: 0, message: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`zibal stub listening on http://${HOST}:${PORT}`);
});
