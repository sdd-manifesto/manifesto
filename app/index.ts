// tslint:disable-next-line:no-import-side-effect
import "source-map-support/register";

import * as http from "http";
import { gitInfo } from "./lib/git";
import { client } from "./lib/mongo";
import { exp } from "./lib/server";

export let GitInfo: { version?: string, date?: string } = {};

async function main(): Promise<void> {
    GitInfo = await gitInfo();
    await client();

    const server = http.createServer(exp);

    server.listen(process.env.PORT || 3000);
    server.on("listening", onListening);

    function onListening(): void {
        const addr = server.address();
        const bind = typeof addr === "string"
            ? "pipe " + addr
            : "port " + addr.port;
        console.log(`Listening on ${bind}`);
    }
}

// tslint:disable-next-line:no-floating-promises
main();
