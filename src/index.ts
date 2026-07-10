import { App } from "./app.ts";
import { registerBenchRoutes } from "./bench.ts";

// 1. Class Repository & Service kamu
class UserRepository {
	getUsers() {
		return [{ id: 1, name: "Pito" }];
	}
}

class UserService {
	constructor(private repo: UserRepository) {}
	getActiveUsers() {
		return this.repo.getUsers();
	}
}

// 2. Buat Interface untuk Container (Cradle)
type Container = {
	userRepo: UserRepository;
	userService: UserService;
	config: { dbName: string; port: number };
	[key: string]: unknown;
};

// 3. Oper interface tersebut ke dalam App!
const app = new App<Container>();

// Registrasi Dependency (Otomatis ditolak TypeScript jika salah nama/tipe!)
const userRepo = new UserRepository();
app.set("userRepo", userRepo);
app.set("userService", new UserService(userRepo));
app.set("config", { dbName: "buntok_db", port: 1212 });

// Register benchmark routes
registerBenchRoutes(app);

// 4. Penggunaan di Controller/Route
app.get("/users", (ctx) => {
	// AJAIB! Coba ketik ctx.di.
	// VSCode akan otomatis memunculkan userService, userRepo, dan config!

	// Memanggil service persis seperti Awilix Cradle
	const users = ctx.di.userService.getActiveUsers();

	// Destructuring juga didukung penuh berkat Proxy!
	const { config } = ctx.di;

	return ctx.json({
		database: config.dbName,
		data: users,
	});
});
