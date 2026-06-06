import cors from "@fastify/cors";
import Fastify from "fastify";
import { config } from "./config.js";
import { getSimilarForSeeds, type Seed } from "./similar.js";
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

app.post<{ Body: { seeds?: Seed[] } }>("/api/similar", async (req, reply) => {
  const seeds = req.body?.seeds;
  if (!Array.isArray(seeds) || seeds.length === 0) {
    return reply
      .code(400)
      .send({ error: "Body must include a non-empty 'seeds' array." });
  }
  const valid = seeds.filter(
    (s) =>
      s &&
      typeof s.id === "string" &&
      typeof s.name === "string" &&
      Array.isArray(s.artists),
  );
  if (valid.length === 0) {
    return reply
      .code(400)
      .send({ error: "Each seed needs 'id', 'name', and 'artists' fields." });
  }
  const tracks = await getSimilarForSeeds(valid.slice(0, 5));
  return { tracks };
});

try {
  // host 0.0.0.0 is required in containers; the default localhost binding
  // is unreachable from outside the container.
  await app.listen({ port: config.port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
