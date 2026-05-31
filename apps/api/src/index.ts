import cors from "@fastify/cors";
import Fastify from "fastify";
import { config } from "./config.js";
import { getSimilarForSeeds } from "./similar.js";
import { searchTracks } from "./spotify.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: config.corsOrigin });

app.get("/health", async () => ({ ok: true }));

app.get<{ Querystring: { q?: string } }>("/api/search", async (req, reply) => {
  const q = req.query.q?.trim();
  if (!q) {
    return reply.code(400).send({ error: "Missing query parameter 'q'." });
  }
  const tracks = await searchTracks(q);
  return { tracks };
});

app.post<{ Body: { trackIds?: string[] } }>("/api/similar", async (req, reply) => {
  const ids = req.body?.trackIds;
  if (!Array.isArray(ids) || ids.length === 0) {
    return reply.code(400).send({ error: "Body must include a non-empty 'trackIds' array." });
  }
  const tracks = await getSimilarForSeeds(ids.slice(0, 5));
  return { tracks };
});

try {
  await app.listen({ port: config.port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
