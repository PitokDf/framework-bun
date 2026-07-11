window.BENCHMARK_DATA = {
  "lastUpdate": 1783777805898,
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
          "id": "940abeacd5a102b7b72d4e2e885aa61e912b1924",
          "message": "feat: Implement strict typed path parameters via Template Literal Types",
          "timestamp": "2026-07-11T20:16:08+07:00",
          "tree_id": "e5c46aec6b969c6b14750dd97efb0d55c4a1d3e7",
          "url": "https://github.com/PitokDf/framework-bun/commit/940abeacd5a102b7b72d4e2e885aa61e912b1924"
        },
        "date": 1783775872975,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "express /plaintext",
            "value": 19085,
            "unit": "req/sec"
          },
          {
            "name": "express /json",
            "value": 21363,
            "unit": "req/sec"
          },
          {
            "name": "express /id/123",
            "value": 18789,
            "unit": "req/sec"
          },
          {
            "name": "fastify /plaintext",
            "value": 25061,
            "unit": "req/sec"
          },
          {
            "name": "fastify /json",
            "value": 24056,
            "unit": "req/sec"
          },
          {
            "name": "fastify /id/123",
            "value": 24861,
            "unit": "req/sec"
          },
          {
            "name": "hono /plaintext",
            "value": 52795,
            "unit": "req/sec"
          },
          {
            "name": "hono /json",
            "value": 39405,
            "unit": "req/sec"
          },
          {
            "name": "hono /id/123",
            "value": 46697,
            "unit": "req/sec"
          },
          {
            "name": "elysia /plaintext",
            "value": 68486,
            "unit": "req/sec"
          },
          {
            "name": "elysia /json",
            "value": 64066,
            "unit": "req/sec"
          },
          {
            "name": "elysia /id/123",
            "value": 68227,
            "unit": "req/sec"
          },
          {
            "name": "buntok /plaintext",
            "value": 52675,
            "unit": "req/sec"
          },
          {
            "name": "buntok /json",
            "value": 53088,
            "unit": "req/sec"
          },
          {
            "name": "buntok /id/123",
            "value": 50502,
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
          "id": "b1201066d2af383207ef177219432c5f8bf4613a",
          "message": "chore: fix biome lint warnings and suppress explicit any",
          "timestamp": "2026-07-11T20:17:45+07:00",
          "tree_id": "8f306bdc55d1c6bac11fa691b3586aba203d8b15",
          "url": "https://github.com/PitokDf/framework-bun/commit/b1201066d2af383207ef177219432c5f8bf4613a"
        },
        "date": 1783775968225,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "express /plaintext",
            "value": 29474,
            "unit": "req/sec"
          },
          {
            "name": "express /json",
            "value": 26579,
            "unit": "req/sec"
          },
          {
            "name": "express /id/123",
            "value": 29944,
            "unit": "req/sec"
          },
          {
            "name": "fastify /plaintext",
            "value": 40507,
            "unit": "req/sec"
          },
          {
            "name": "fastify /json",
            "value": 40780,
            "unit": "req/sec"
          },
          {
            "name": "fastify /id/123",
            "value": 41558,
            "unit": "req/sec"
          },
          {
            "name": "hono /plaintext",
            "value": 61254,
            "unit": "req/sec"
          },
          {
            "name": "hono /json",
            "value": 55239,
            "unit": "req/sec"
          },
          {
            "name": "hono /id/123",
            "value": 59777,
            "unit": "req/sec"
          },
          {
            "name": "elysia /plaintext",
            "value": 73110,
            "unit": "req/sec"
          },
          {
            "name": "elysia /json",
            "value": 70069,
            "unit": "req/sec"
          },
          {
            "name": "elysia /id/123",
            "value": 72864,
            "unit": "req/sec"
          },
          {
            "name": "buntok /plaintext",
            "value": 61506,
            "unit": "req/sec"
          },
          {
            "name": "buntok /json",
            "value": 63223,
            "unit": "req/sec"
          },
          {
            "name": "buntok /id/123",
            "value": 59992,
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
          "id": "69e02fb9f051fd937a7f6b9253dd0d4775221e47",
          "message": "chore: setup tsup build and configure NPM publish workflow",
          "timestamp": "2026-07-11T20:39:02+07:00",
          "tree_id": "205b04ab2c5bcf33cd2036bb511e97b3f67a19ac",
          "url": "https://github.com/PitokDf/framework-bun/commit/69e02fb9f051fd937a7f6b9253dd0d4775221e47"
        },
        "date": 1783777246118,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "express /plaintext",
            "value": 28701,
            "unit": "req/sec"
          },
          {
            "name": "express /json",
            "value": 26805,
            "unit": "req/sec"
          },
          {
            "name": "express /id/123",
            "value": 28994,
            "unit": "req/sec"
          },
          {
            "name": "fastify /plaintext",
            "value": 39024,
            "unit": "req/sec"
          },
          {
            "name": "fastify /json",
            "value": 38644,
            "unit": "req/sec"
          },
          {
            "name": "fastify /id/123",
            "value": 38743,
            "unit": "req/sec"
          },
          {
            "name": "hono /plaintext",
            "value": 60177,
            "unit": "req/sec"
          },
          {
            "name": "hono /json",
            "value": 51213,
            "unit": "req/sec"
          },
          {
            "name": "hono /id/123",
            "value": 58196,
            "unit": "req/sec"
          },
          {
            "name": "elysia /plaintext",
            "value": 73072,
            "unit": "req/sec"
          },
          {
            "name": "elysia /json",
            "value": 70227,
            "unit": "req/sec"
          },
          {
            "name": "elysia /id/123",
            "value": 73154,
            "unit": "req/sec"
          },
          {
            "name": "buntok /plaintext",
            "value": 61892,
            "unit": "req/sec"
          },
          {
            "name": "buntok /json",
            "value": 62428,
            "unit": "req/sec"
          },
          {
            "name": "buntok /id/123",
            "value": 59651,
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
          "id": "f4eded4f50720209ebedacd1133d4702afe7e5d4",
          "message": "bump version",
          "timestamp": "2026-07-11T20:48:16+07:00",
          "tree_id": "1cb3897c4264650de9b240915bf93656d0258afa",
          "url": "https://github.com/PitokDf/framework-bun/commit/f4eded4f50720209ebedacd1133d4702afe7e5d4"
        },
        "date": 1783777805124,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "express /plaintext",
            "value": 20444,
            "unit": "req/sec"
          },
          {
            "name": "express /json",
            "value": 20468,
            "unit": "req/sec"
          },
          {
            "name": "express /id/123",
            "value": 20339,
            "unit": "req/sec"
          },
          {
            "name": "fastify /plaintext",
            "value": 26326,
            "unit": "req/sec"
          },
          {
            "name": "fastify /json",
            "value": 25519,
            "unit": "req/sec"
          },
          {
            "name": "fastify /id/123",
            "value": 26401,
            "unit": "req/sec"
          },
          {
            "name": "hono /plaintext",
            "value": 51197,
            "unit": "req/sec"
          },
          {
            "name": "hono /json",
            "value": 37843,
            "unit": "req/sec"
          },
          {
            "name": "hono /id/123",
            "value": 45012,
            "unit": "req/sec"
          },
          {
            "name": "elysia /plaintext",
            "value": 67388,
            "unit": "req/sec"
          },
          {
            "name": "elysia /json",
            "value": 63439,
            "unit": "req/sec"
          },
          {
            "name": "elysia /id/123",
            "value": 67583,
            "unit": "req/sec"
          },
          {
            "name": "buntok /plaintext",
            "value": 51512,
            "unit": "req/sec"
          },
          {
            "name": "buntok /json",
            "value": 52651,
            "unit": "req/sec"
          },
          {
            "name": "buntok /id/123",
            "value": 48337,
            "unit": "req/sec"
          }
        ]
      }
    ]
  }
}