const fs = require('fs');
let appTs = fs.readFileSync('src/app.ts', 'utf8');

const typeDefs = `
export type ExtractParams<Path extends string> = 
  Path extends \`\${infer _Start}:\${infer Param}/\${infer Rest}\`
    ? { [K in Param]: string } & ExtractParams<\`/\${Rest}\`>
    : Path extends \`\${infer _Start}:\${infer Param}\`
      ? { [K in Param]: string }
      : Path extends \`\${infer _Start}*\${infer Catchall}\`
        ? { [K in Catchall]: string } & { "*": string }
        : {};

export type Handler<DI = Record<string, unknown>, Path extends string = string> = (
	ctx: Context<DI, ExtractParams<Path>>,
) => Response | Promise<Response>;
export type Middleware<DI = Record<string, unknown>, Path extends string = string> = (
	ctx: Context<DI, ExtractParams<Path>>,
	next: () => Promise<Response> | Response,
) => Response | Promise<Response>;
export type ErrorHandler<DI = Record<string, unknown>> = (
	err: Error,
	ctx: Context<DI, any>,
) => Response | Promise<Response>;
export type NotFoundHandler<DI = Record<string, unknown>> = (
	ctx: Context<DI, any>,
) => Response | Promise<Response>;
`;

appTs = appTs.replace(/export type Handler<DI[^;]+;/, '');
appTs = appTs.replace(/export type Middleware<DI[^;]+;/, '');
appTs = appTs.replace(/export type ErrorHandler<DI[^;]+;/, '');
appTs = appTs.replace(/export type NotFoundHandler<DI[^;]+;/, typeDefs.trim());

// Update RouterGroup get, post, put, delete, etc.
const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
for (const method of methods) {
	appTs = appTs.replace(
		new RegExp(`public ${method}\\(path: string, handler: Handler<DI>\\): this;\\n\\s*public ${method}\\(\\n\\s*path: string,\\n\\s*middleware: Middleware<DI>,\\n\\s*handler: Handler<DI>,\\n\\s*\\): this;\\n\\s*public ${method}\\(\\n\\s*path: string,\\n\\s*\\.\\.\\.handlers: Array<Middleware<DI> \\| Handler<DI>>\\n\\s*\\): this \\{`),
		`public ${method}<Path extends string>(path: Path, handler: Handler<DI, Path>): this;\n\tpublic ${method}<Path extends string>(\n\t\tpath: Path,\n\t\tmiddleware: Middleware<DI, Path>,\n\t\thandler: Handler<DI, Path>,\n\t): this;\n\tpublic ${method}<Path extends string>(\n\t\tpath: Path,\n\t\t...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>\n\t): this {`
	);
}

// Update App get, post, etc. (App has up to 4 middlewares overload)
for (const method of methods) {
	appTs = appTs.replace(
		new RegExp(`public ${method}\\(path: string, handler: Handler<DI>\\): this;[\\s\\S]*?public ${method}\\(\\n\\s*path: string,\\n\\s*\\.\\.\\.handlers: Array<Middleware<DI> \\| Handler<DI>>\\n\\s*\\): this \\{`, 'g'),
		`public ${method}<Path extends string>(path: Path, handler: Handler<DI, Path>): this;\n\tpublic ${method}<Path extends string>(\n\t\tpath: Path,\n\t\tmiddleware: Middleware<DI, Path>,\n\t\thandler: Handler<DI, Path>,\n\t): this;\n\tpublic ${method}<Path extends string>(\n\t\tpath: Path,\n\t\tm1: Middleware<DI, Path>,\n\t\tm2: Middleware<DI, Path>,\n\t\thandler: Handler<DI, Path>,\n\t): this;\n\tpublic ${method}<Path extends string>(\n\t\tpath: Path,\n\t\tm1: Middleware<DI, Path>,\n\t\tm2: Middleware<DI, Path>,\n\t\tm3: Middleware<DI, Path>,\n\t\thandler: Handler<DI, Path>,\n\t): this;\n\tpublic ${method}<Path extends string>(\n\t\tpath: Path,\n\t\tm1: Middleware<DI, Path>,\n\t\tm2: Middleware<DI, Path>,\n\t\tm3: Middleware<DI, Path>,\n\t\tm4: Middleware<DI, Path>,\n\t\thandler: Handler<DI, Path>,\n\t): this;\n\tpublic ${method}<Path extends string>(\n\t\tpath: Path,\n\t\t...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>\n\t): this {`
	);
}

fs.writeFileSync('src/app.ts', appTs);
console.log("Replaced");
