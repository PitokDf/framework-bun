import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "WebSocket",
  description: "Handle WebSocket connections with rooms, pub/sub, and typed messages.",
};


export default function WebSocketPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        WebSocket
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Bidirectional real-time communication backed by Bun's native WebSocket
        server. No polyfills or extra abstraction - direct access to{" "}
        <code>Bun.serve</code> WebSocket.
      </p>

      <Callout type="info">
        For one-way server-to-client streaming, see{" "}
        <a href="/docs/sse" className="text-accent hover:underline">
          SSE
        </a>
        . WebSocket is best for chat, games, and collaboration where both sides
        need to send messages.
      </Callout>

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`const app = new App();

app.ws("/chat", {
  open: (ws) => {
    console.log("Client connected");
  },
  message: (ws, message) => {
    // Echo back
    ws.send(message);
  },
  close: (ws, code, reason) => {
    console.log("Disconnected:", code, reason);
  },
});

app.listen(1212);`}
      />

      {/* ──────────────── WS HANDLER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        WSHandler
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Callback
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Signature
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                When
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "open",
                "(ws) => void",
                "Client connects",
              ],
              [
                "message",
                "(ws, message: string | Buffer) => void",
                "Client sends a message",
              ],
              [
                "close",
                "(ws, code: number, reason: string) => void",
                "Client disconnects",
              ],
              [
                "drain",
                "(ws) => void",
                "Buffer is ready for more data",
              ],
            ].map(([cb, sig, when]) => (
              <tr
                key={cb}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{cb}</td>
                <td className="px-4 py-2 font-mono text-text-secondary text-xs">
                  {sig}
                </td>
                <td className="px-4 py-2">{when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── PUB/SUB ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Pub/Sub (Rooms)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Bun's WebSocket supports publish/subscribe for broadcasting to groups of
        clients (rooms):
      </p>
      <CodeBlock
        code={`app.ws("/chat", {
  open: (ws) => {
    // Join a room
    ws.subscribe("general");
  },
  message: (ws, message) => {
    // Broadcast to everyone in the room
    ws.publish("general", message);
  },
  close: (ws) => {
    // Auto-unsubscribed on close
  },
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Multiple Rooms
      </Heading>
      <CodeBlock
        code={`app.ws("/chat", {
  open: (ws) => {
    ws.subscribe("room-1");
    ws.subscribe("room-2");
  },
  message: (ws, msg) => {
    // Send to specific room
    ws.publish("room-1", msg);
  },
});`}
      />

      {/* ──────────────── SERVER BROADCAST ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Server-side Broadcast
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>app.server.publish()</code> to broadcast from HTTP routes:
      </p>
      <CodeBlock
        code={`// HTTP route broadcasts to WebSocket clients
app.post("/notify", async (ctx) => {
  const { message } = await ctx.body();

  // Broadcast to all clients in "notifications" room
  app.server?.publish("notifications", JSON.stringify({
    type: "notification",
    data: message,
  }));

  return ctx.json({ sent: true });
});

// WebSocket handler subscribes to the room
app.ws("/notifications", {
  open: (ws) => ws.subscribe("notifications"),
  message: (ws, msg) => ws.publish("notifications", msg),
});`}
      />

      {/* ──────────────── BINARY DATA ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Binary Data
      </Heading>
      <CodeBlock
        code={`app.ws("/binary", {
  message: (ws, message) => {
    if (message instanceof Buffer) {
      // Handle binary data
      console.log("Received bytes:", message.length);
      ws.send(message); // Echo binary
    } else {
      // Handle text data
      ws.send(JSON.stringify({ echo: message }));
    }
  },
});`}
      />

      {/* ──────────────── CONTEXT ACCESS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Context Access
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Each WebSocket connection has access to the HTTP request context via{" "}
        <code>ws.data</code>:
      </p>
      <CodeBlock
        code={`app.ws("/auth-ws", {
  open: (ws) => {
    // Access the HTTP request context
    const ctx = ws.data.ctx;
    const url = ctx.request.url;
    const ip = ctx.ip;
    console.log(\`New connection from \${ip} to \${url}\`);
  },
  message: (ws, message) => {
    // Access handler reference
    const handler = ws.data.handler;
  },
});`}
      />

      {/* ──────────────── GROUP WEBSOCKET ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Group WebSocket
      </Heading>
      <CodeBlock
        code={`const api = app.group("/api");

// /api/ws/notifications
api.ws("/ws/notifications", {
  open: (ws) => ws.subscribe("notifications"),
  message: (ws, msg) => ws.publish("notifications", msg),
});`}
      />

      {/* ──────────────── CHAT EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example: Chat Room
      </Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";

const app = new App();
const rooms = new Map<string, Set<string>>();

app.ws("/chat/:room", {
  open: (ws) => {
    const room = ws.data.ctx.params.room;
    ws.subscribe(room);

    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room)!.add(ws.data.ctx.ip);

    ws.publish(room, JSON.stringify({
      type: "join",
      users: rooms.get(room)!.size,
    }));
  },
  message: (ws, message) => {
    const room = ws.data.ctx.params.room;
    ws.publish(room, JSON.stringify({
      type: "message",
      data: message,
    }));
  },
  close: (ws, code) => {
    const room = ws.data.ctx.params.room;
    const roomUsers = rooms.get(room);
    if (roomUsers) {
      roomUsers.delete(ws.data.ctx.ip);
      if (roomUsers.size === 0) rooms.delete(room);
    }
  },
});

app.listen(1212);`}
      />

      {/* ──────────────── NEXT STEPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Next Steps
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <a href="/docs/sse" className="text-accent hover:underline">
            SSE
          </a>{" "}
          - Simpler server-to-client streaming
        </li>
        <li>
          <a href="/docs/emitter" className="text-accent hover:underline">
            Event Emitter
          </a>{" "}
          - Decouple code with events
        </li>
        <li>
          <a href="/docs/routing" className="text-accent hover:underline">
            Routing
          </a>{" "}
          - Route groups and middleware
        </li>
      </ul>
    </div>
  );
}
