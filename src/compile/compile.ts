import { baseUrl } from "../base";

export interface Compiler {
    compile(files : Record<string, Uint8Array>) : Promise<boolean>

    getHex() : Promise<Uint8Array>
}

export class CODALCompiler implements Compiler {
    private llvmWorker : Worker;

    constructor() {
        this.llvmWorker = new Worker(`${baseUrl}codal-wasm/llvm-worker.js`, {type:"module"})
        this.llvmWorker.onmessage = (e => this.handleWorkerMessage(e));
    }

    private errorComing : boolean = false;
    private completionComing : boolean = false;

    private compiling : boolean = false;

    private hex : Uint8Array = new Uint8Array();

    private handleWorkerMessage(e : MessageEvent<any>) {
        const msg = e.data;

        switch (msg.type) {
            case "info":    console.log(`[CODAL] ${msg.body}`);     break;
            case "error":   console.error(`[CODAL] Error: ${msg.body}`);   break;
            case "stderr":  console.error(`[CODAL] ${msg.source} error\nstderr: ${msg.body}`);  break;
            case "hex":
                console.log("[CODAL] Compile complete.");
                this.hex = msg.body;
                this.compiling = false;
                break;
            case "output":
                console.log(`[CODAL] ${msg.source} output:`); console.log(msg.body);  break;
            default:        console.warn(`Unhandled message '${msg.type}' from CODAL worker.\nFull message:\n${msg}`);
        }
    }

    async compile(files : Record<string, Uint8Array>) : Promise<boolean> {
        this.compiling = true;
        this.llvmWorker.postMessage(files);

        //Shouldn't do this :/
        while(this.compiling) {
            await new Promise<void>(resolve => {
                setTimeout(() => {resolve();}, 1);
            })
        }

        return true;
    }

    async getHex() : Promise<Uint8Array> {
        return this.hex;
    }
}

export const compilerInstance : Compiler = new CODALCompiler();