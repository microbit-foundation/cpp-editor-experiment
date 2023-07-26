
import { baseUrl } from "../base"
import { Clangd } from "./clangd";
import { CODALCompiler } from "./compile";

let clangObj : Clang;

export interface Clang {
    worker : Worker,
    compiler: CODALCompiler,
    clangd: Clangd,
}

export const clang = (langauge : string) : Clang => {
    if (clangObj) return clangObj;

    const clangWorker = new Worker(`${baseUrl}codal-wasm/llvm-worker.js`, {type:"module"});
    const compiler = new CODALCompiler(clangWorker);
    const clangd = new Clangd(clangWorker, langauge);

    const originalOnMessage = clangWorker.onmessage;
    clangWorker.onmessage = (e => {
        const msg = e.data;
            switch (msg.target) {
                case "compile":     compiler.handleWorkerMessage(msg);  break;
                case "clangd":      originalOnMessage?.call(clangWorker, e); break; //this is the handler created by the vscode-jsonrpc connection
                case "worker":      handleWorkerMessage(msg);   break;
                default:            console.warn(`Unknown message target '${msg.target}' from worker.\nFull message:`); console.warn(msg);
            }
    });

    clangObj = {
        worker: clangWorker,
        compiler: compiler,
        clangd: clangd,
    }

    return clangObj;
}

function handleWorkerMessage(msg : any) {
    switch (msg.type) {
        case "info":    console.log(`[Worker] ${msg.body}`);   break;
        case "error":   console.error(`[Worker] Error: ${msg.body}`);   break;
        default:        console.warn(`Unhandled message '${msg.type}' from worker.\nFull message:\n${msg}`);
    }
}


