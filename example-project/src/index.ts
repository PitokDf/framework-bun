import { App } from "buntok";
import { ProductController } from "./controllers/product.controller";
import { PostController } from "./controllers/post.controller";

// Create Buntok application instance
type Container = { db: null; mailer: { name: String } };
export const app = new App<Container>();


// Register controllers using decorators (Best Practice)
app.registerController(ProductController);
app.registerController(PostController)

app.static("/docs", "./public/docs")
// Basic routing fallback
app.get("/", (ctx) => {
  return ctx.json({
    message: "Welcome to Buntok Enterprise Framework!",
    version: "0.2.0"
  });
});

// Dynamic routing with parameters
app.get("/users/:id", (ctx) => {
  const { id } = ctx.params;
  return ctx.json({ userId: id, status: "active" });
});

// POST request example
app.post("/data", async (ctx) => {
  const body = await ctx.request.json();
  return ctx.json({ received: true, data: body }, 201);
});

app.enableDevTools()

app.listen(3001);