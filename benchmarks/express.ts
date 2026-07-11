import express from "express";

const app = express();
app.get("/plaintext", (req, res) => res.send("Hello, World!"));
app.get("/json", (req, res) => res.json({ message: "Hello, World!" }));
app.get("/id/:id", (req, res) => res.send(req.params.id));

app.listen(3000, () => {
	console.log("Express running on 3000");
});
