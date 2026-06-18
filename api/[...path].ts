// Single Vercel Serverless Function that serves the entire CAPA API.
//
// The `[...path]` catch-all receives every `/api/*` request (so the Express
// routes, which are defined with their `/api/...` prefix, match on req.url).
// The server seeds an in-memory SQLite database on cold start — state is not
// persisted between invocations, which is fine for the demo.
import app from "../server/src/index.js";

export default app;
