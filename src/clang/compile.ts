
export interface Compiler {
    compile(files : Record<string, Uint8Array>) : Promise<void>
    getHex() : Promise<Uint8Array>
}

export class CODALCompiler implements Compiler {
    private errorFlag = false;
    private compiling : boolean = false;

    private hex : Uint8Array = new Uint8Array();
    private stderr : string = "";

    private worker : Worker;

    constructor (worker : Worker) {
        this.worker = worker;
    }

    public handleWorkerMessage(msg : any) {
        switch (msg.type) {
            case "info":    console.log(`[CODAL] ${msg.body}`);     break;
            case "error":   
                console.error(`[CODAL] Error: ${msg.body}`);   
                this.errorFlag = true;
                break;
            case "stderr":  
                console.error(`[CODAL] ${msg.source} error\nstderr: ${msg.body}`);
                this.errorFlag = true;
                this.stderr = msg.body;  
                break;
            case "compile-complete":
                console.log("[CODAL] Compile complete.");
                this.compiling = false;
                break;
            case "hex":
                this.hex = msg.body;
                break;
            case "output":
                console.log(`[CODAL] ${msg.source} output:`); console.log(msg.body);  break;
            default:        console.warn(`Unhandled message '${msg.type}' from CODAL worker.\nFull message:\n${msg}`);
        }
    }

    async compile(files : Record<string, Uint8Array>) : Promise<void> {
        this.compiling = true;
        this.errorFlag = false; //clear error flag before compile

        this.worker.postMessage({
            type: "compile",
            body: files,
        });

        //Shouldn't do this incase compiler gets stuck :/
        while(this.compiling) {
            await new Promise<void>(resolve => {
                setTimeout(() => {resolve();}, 1);
            })
        }

        if (this.errorFlag) {
            throw new Error(this.stderr);
        }
    }

    async getHex() : Promise<Uint8Array> {
        return this.hex;
    }
}

// export const compilerInstance : Compiler = new CODALCompiler();