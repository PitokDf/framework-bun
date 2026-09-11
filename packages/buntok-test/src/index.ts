import { App, compress, responseTime } from "@buntok/core";
import "./env";
import { TestController } from "./controllers/test.controller";
import { Container } from "@buntok/core";
import { MailerController } from "./controllers/mailer.controller";
import { PaymentController } from "./controllers/payment.controller";

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

app.registerController([
	TestController,
	MailerController,
	PaymentController
]);
export default app;
