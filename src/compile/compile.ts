import text from "./microbit-test.hex";
import maincpp from "./main.hex";   //hex file because txt or cpp want working :/ (its temporary anyway)
import { asciiToBytes } from "../fs/fs-util";
import { baseUrl } from "../base";

// import { LLVM } from "../codal-wasm/llvm-worker"

export interface Compiler {
    compile() : Promise<boolean>

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

    private handleWorkerMessage(e : MessageEvent) {
        if(this.errorComing){
            console.log("[CODAL] error coming true");
            // removeErrors();
            // if (e.data.includes("error"))showError(e.data);
            this.errorComing = false;
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
                console.log("[CODAL] COMPILE READY"); 
                break;
            case "error":
                this.errorComing = true;
                break;
            case "completions":
                this.completionComing = true;
                break;
            default:
                console.log("[CODAL] Compile complete");
                // removeErrors();
                // if(document.getElementById("connect").disabled && daplink) hexCode = e.data;
                // else download(hex2ascii(toHexString(e.data)),"MICROBIT.hex");   // Determine IF flash or just download here.
                // console.timeEnd('Round-trip: ')
                break;
        }
    }

    async compile() : Promise<boolean> {
        const file = await this.decodeFile(maincpp);

        this.llvmWorker.postMessage({"main.cpp":file});

        return true;
    }

    async getHex() : Promise<Uint8Array> {
        return asciiToBytes(await this.decodeFile(text));
        // return this.llvm.getHex();
    }

    //temporary
    async decodeFile(raw : any) {
        return fetch(raw)
        .then(t => t.text())
        .then(t => {return t})
    } 
}