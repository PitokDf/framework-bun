import { 
	App, 
	Cache, 
	MemoryCacheDriver, 
	Queue, 
	MemoryQueueDriver,
	setDefaultSchedulerDriver,
	MemorySchedulerDriver
} from "buntok";

import { HomeController } from "./controllers/home.controller";

// 1. Set global default scheduler driver
setDefaultSchedulerDriver(new MemorySchedulerDriver());

const app = new App();

// 2. Register Cache and Queue into DI
app.set("cache", new Cache(new MemoryCacheDriver()));
app.set("queue", new Queue(new MemoryQueueDriver("main")));

// 3. Register Controllers
app.registerController(HomeController);

export default app;
