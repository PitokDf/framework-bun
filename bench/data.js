window.BENCHMARK_DATA = {
  "lastUpdate": 1783775368729,
  "repoUrl": "https://github.com/PitokDf/framework-bun",
  "entries": {
    "Buntok Benchmark": [
      {
        "commit": {
          "author": {
            "email": "108637369+PitokDf@users.noreply.github.com",
            "name": "Pito Desri Pauzi",
            "username": "PitokDf"
          },
          "committer": {
            "email": "108637369+PitokDf@users.noreply.github.com",
            "name": "Pito Desri Pauzi",
            "username": "PitokDf"
          },
          "distinct": true,
          "id": "517bf3153cf9d1ba64f58ce3eab0cead4c488e6e",
          "message": "feat: re-enable auto-push to gh-pages",
          "timestamp": "2026-07-10T11:32:49+07:00",
          "tree_id": "585111f32a83f9b213a5874d45408dc4374c6667",
          "url": "https://github.com/PitokDf/framework-bun/commit/517bf3153cf9d1ba64f58ce3eab0cead4c488e6e"
        },
        "date": 1783658095977,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Plaintext",
            "value": 12168,
            "range": "±21%",
            "unit": "req/sec"
          },
          {
            "name": "JSON Serialization",
            "value": 13190,
            "range": "±5%",
            "unit": "req/sec"
          },
          {
            "name": "Single Query (DB)",
            "value": 13173,
            "range": "±7%",
            "unit": "req/sec"
          },
          {
            "name": "Multiple Queries (10)",
            "value": 12148,
            "range": "±4%",
            "unit": "req/sec"
          },
          {
            "name": "Fortunes (HTML)",
            "value": 12357,
            "range": "±3%",
            "unit": "req/sec"
          },
          {
            "name": "Data Updates (10)",
            "value": 11623,
            "range": "±5%",
            "unit": "req/sec"
          },
          {
            "name": "Route Params",
            "value": 13122,
            "range": "±3%",
            "unit": "req/sec"
          },
          {
            "name": "Query String",
            "value": 12662,
            "range": "±3%",
            "unit": "req/sec"
          },
          {
            "name": "POST JSON 1KB",
            "value": 56749,
            "range": "±3%",
            "unit": "req/sec"
          },
          {
            "name": "Middleware 5 Layers",
            "value": 12908,
            "range": "±3%",
            "unit": "req/sec"
          },
          {
            "name": "Static File 100KB",
            "value": 9410,
            "range": "±10%",
            "unit": "req/sec"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "108637369+PitokDf@users.noreply.github.com",
            "name": "Pito Desri Pauzi",
            "username": "PitokDf"
          },
          "committer": {
            "email": "108637369+PitokDf@users.noreply.github.com",
            "name": "Pito Desri Pauzi",
            "username": "PitokDf"
          },
          "distinct": true,
          "id": "8d8eb4f22d444a443826226eaf17e767ba290066",
          "message": "feat: AOT Router compiler & All-framework benchmark suite CI",
          "timestamp": "2026-07-11T20:07:44+07:00",
          "tree_id": "10babe100fea1ea4505fe6ebfb4f073c75bed596",
          "url": "https://github.com/PitokDf/framework-bun/commit/8d8eb4f22d444a443826226eaf17e767ba290066"
        },
        "date": 1783775368279,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "express /plaintext",
            "value": 41363,
            "unit": "req/sec"
          },
          {
            "name": "express /json",
            "value": 41990,
            "unit": "req/sec"
          },
          {
            "name": "express /id/123",
            "value": 41569,
            "unit": "req/sec"
          },
          {
            "name": "fastify /plaintext",
            "value": 68657,
            "unit": "req/sec"
          },
          {
            "name": "fastify /json",
            "value": 67583,
            "unit": "req/sec"
          },
          {
            "name": "fastify /id/123",
            "value": 68089,
            "unit": "req/sec"
          },
          {
            "name": "hono /plaintext",
            "value": 104513,
            "unit": "req/sec"
          },
          {
            "name": "hono /json",
            "value": 90099,
            "unit": "req/sec"
          },
          {
            "name": "hono /id/123",
            "value": 98403,
            "unit": "req/sec"
          },
          {
            "name": "elysia /plaintext",
            "value": 138116,
            "unit": "req/sec"
          },
          {
            "name": "elysia /json",
            "value": 129933,
            "unit": "req/sec"
          },
          {
            "name": "elysia /id/123",
            "value": 135852,
            "unit": "req/sec"
          },
          {
            "name": "buntok /plaintext",
            "value": 59170,
            "unit": "req/sec"
          },
          {
            "name": "buntok /json",
            "value": 59495,
            "unit": "req/sec"
          },
          {
            "name": "buntok /id/123",
            "value": 59273,
            "unit": "req/sec"
          }
        ]
      }
    ]
  }
}