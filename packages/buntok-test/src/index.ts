import { App, compress, responseTime, AICache } from "@buntok/core";
import "./env";
import { TestController } from "./controllers/test.controller";
import { Container } from "@buntok/core";
import { DecoratorController } from "@/modules/decorator";

export const app = new App();


app.use(responseTime());

app.use(compress());
app.cors({
	origin: "*",
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	credentials: true,
});

app.apiDocs({
	title: "API Documentation",
	version: "1.0.1",
	description: "api docs for buntok test",
});

app.get("/rtr", () => "Hai");

const container = new Container();
container.scan([TestController]);
app.setContainer(container);

app.registerController([DecoratorController]);
export default app;
