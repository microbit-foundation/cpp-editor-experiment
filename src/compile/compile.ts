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
        if(this.errorComing){
            console.log("[CODAL] error coming true");
            // removeErrors();
            // if (e.data.includes("error"))showError(e.data);
            this.errorComing = false;
            // this.compiling = false;
            return;
        }
        if(this.completionComing){
            console.log("[CODAL] completion coming true");

            // completionData = e.data.stdout;
            // if(completionData!="" || completionData!=null) editor.showHint({hint: parseCompletion});
            // checkHint();
            // completionData = null;
            this.completionComing = false;
            return;
        }    
        switch (e.data){
            case "fs":          console.log("[CODAL] FS creation");   break;
            case "download":    console.log("[CODAL] Downloading");   break;    
            case "populate":    console.log("[CODAL] Populating FS"); break;  
            case "wasm":        console.log("[CODAL] Wasm Modules");  break;  
            case "busy":        console.log("[CODAL] Downloading");   break;
            case "headers":     console.log("[CODAL] Headers");       break;
            case "ready":
                console.log("[CODAL] Compile Ready"); 
                break;
            case "error":
                this.errorComing = true;
                break;
            case "completions":
                this.completionComing = true;
                break;
            default:
                console.log("[CODAL] Compile Complete");
                this.hex = e.data;
                this.compiling = false;
                // removeErrors();
                // if(document.getElementById("connect").disabled && daplink) hexCode = e.data;
                // else download(hex2ascii(toHexString(e.data)),"MICROBIT.hex");   // Determine IF flash or just download here.
                // console.timeEnd('Round-trip: ')
                break;
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