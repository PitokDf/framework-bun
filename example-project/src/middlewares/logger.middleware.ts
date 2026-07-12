import type { Context } from "buntok";

export async function LoggerMiddleware(ctx: Context, next: () => Promise<void>) {
  // TODO: Implement middleware logic here
  // Example: 
  // const token = ctx.request.headers.get("Authorization");
  // if (!token) {
  //   return ctx.json({ error: "Unauthorized" }, 401);
  // }
  
  console.log(`[LoggerMiddleware] processing request for: ${ctx.request.url}`);
  
  // Call the next middleware or route handler in the chain
  await next();
  
  // Logic after the route handler finishes
  // console.log(`[LoggerMiddleware] response ready`);
}
