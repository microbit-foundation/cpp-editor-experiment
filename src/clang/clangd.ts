import { 
    createMessageConnection, 
    // Logger,
} from "vscode-jsonrpc";
import { createUri, LanguageServerClient } from "../language-server/client";
import { WorkerStructuredMessageReader, WorkerStructuredMessageWriter } from "./WorkerStructuredMessage";

export class Clangd {
    private worker : Worker;
    private client : LanguageServerClient;

    constructor(worker : Worker, langauge: string) {

        // const logger : Logger = {
        //     error: (message: string) => {console.error(message)},
	    //     warn: (message: string) => {console.warn(message)},
	    //     info: (message: string) => {console.log(message)},
	    //     log: (message: string) => {console.log(message)},
        // };

        const connection = createMessageConnection(
            new WorkerStructuredMessageReader(worker, "body"),
            new WorkerStructuredMessageWriter(worker, {
                type: "clangd",
            }, "body"),
            // logger,
        )
        connection.listen();

        this.client = new LanguageServerClient(connection, langauge, createUri(""));
        this.worker = worker;
    }

    public clangdClient() : LanguageServerClient | undefined {
        if (this.client === undefined) console.warn("Langauge server client is not ready yet!");
        return this.client;
    }
}