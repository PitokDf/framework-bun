# Buntok Benchmarks Dashboard

This dashboard visualizes the performance benchmarks of **Buntok** compared to other Bun frameworks.

## Performance Results

Buntok is designed for extreme performance, leveraging Bun's native C++ APIs, Ahead-Of-Time (AOT) routing compilation, and zero-overhead middleware pipelines.

### Hello World (Plain Text)

| Framework | Requests/sec | Latency (avg) | Notes |
|-----------|--------------|---------------|-------|
| **Buntok** | **~33,000+** | **< 1ms** | Optimized `Bun.serve` + Nested Maps Trie |
| Elysia    | ~32,000      | < 1ms | - |
| Hono      | ~30,000      | < 1ms | - |

*Note: Benchmarks run on a standard Linux environment using `bun run bench:all`. Performance may vary by hardware.*

## Architectural Optimizations

Buntok achieves these speeds through several core architectural decisions:

1. **AOT Pipeline Compilation**: Middleware pipelines (`app.use`) are compiled into a single `new Function(...)` at boot time. This eliminates array iteration overhead during request handling.
2. **O(1) Route Cache**: Static routes and previously visited dynamic routes are cached in a highly optimized nested `Map` structure, providing instantaneous O(1) lookup speeds.
3. **Zero-Overhead Decorators**: Stage 3 decorators are resolved at initialization, directly mapping to the router without requiring `reflect-metadata` overhead at runtime.
4. **Native C++ Execution**: Features like `Response.json()` are passed directly to Bun's C++ layer rather than executing slow `JSON.stringify` logic in JavaScript.

## Running Benchmarks Locally

To verify these results on your own machine:

```bash
# Go to project root
cd ../../

# Run the benchmark suite
bun run bench:all
```
