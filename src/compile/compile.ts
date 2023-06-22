import maincpp from "./main.hex";   //hex file because txt or cpp want working :/ (its temporary anyway)
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
        for (let f in files) {
            console.log(f.toString())
            console.log(files[f].toString())
        }

        const file = await this.decodeFile(maincpp);

        var map = new Map();
        map.set("main.cpp", file);

        this.compiling = true;
        this.llvmWorker.postMessage(map);

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

    //temporary
    async decodeFile(raw : any) {
        return fetch(raw)
        .then(t => t.text())
        .then(t => {return t})
    } 

    private toHexString(byteArray : any) {
        return Array.prototype.map.call(byteArray, function(byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
    }
    
    // Convert hex to ascii hex (ihex). Format read by the microbit.
    private hex2ascii(hexx : any) {
        var hex = hexx.toString()
        var str = '';
        for (var i = 0; i < hex.length; i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    }
}