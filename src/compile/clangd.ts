import { createMessageConnection } from "vscode-jsonrpc";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from "vscode-jsonrpc/browser";
import { createUri, LanguageServerClient } from "../language-server/client";

export class Clangd {
    private worker : Worker;
    private client : LanguageServerClient;

    constructor(worker : Worker, langauge: string) {
        const connection = createMessageConnection(
            new BrowserMessageReader(worker),
            new BrowserMessageWriter(worker)
        )
        connection.listen();

        this.client = new LanguageServerClient(connection, langauge, createUri(""));
        this.worker = worker;
    }

    public clangdClient() : LanguageServerClient | undefined {
        if (this.client === undefined) console.warn("Langauge server client is not ready yet!");
        return this.client;
    }

    public handleWorkerMessage(msg : any) {
        switch (msg.type) {
            case "response":   
                console.log("[LS] Repsonse");
                console.log(msg.body);
                break;
            default: console.warn(`Unhandled message '${msg.type}' from worker.\nFull message:\n${msg}`);
        }
    }
}