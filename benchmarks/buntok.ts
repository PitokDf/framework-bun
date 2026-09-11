import { App, Controller, Get } from "../packages/buntok-core/src/index.ts";

const app = new App();
app.disable("x-powered-by");

@Controller("/")
class Test {
	@Get("/plaintext")
	plaintext() {
		return "Hello, World!";
	}

	@Get("/json")
	json() {
		return { message: "Hello, World!" };
	}

	@Get("/id/:id")
	id({ params }: { params: { id: string } }) {
		return params.id;
	}
}

app.registerController(Test)

app.listen(3000, () => {
	console.log("Buntok running on 3000");
});
