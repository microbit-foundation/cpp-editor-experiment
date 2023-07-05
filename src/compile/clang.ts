
import { baseUrl } from "../base"
import { CODALCompiler } from "./compile";

let clangObj : Clang;

interface Clang {
    worker : Worker,
    compiler: CODALCompiler,
}

export const clang = () : Clang => {
    if (clangObj) return clangObj;

    const clangWorker = new Worker(`${baseUrl}codal-wasm/llvm-worker.js`, {type:"module"});
    const compiler = new CODALCompiler(clangWorker);

    clangWorker.onmessage = (e => {
        const msg = e.data;
            switch (msg.target) {
                case "compile":     compiler.handleWorkerMessage(msg);  break;
                case "clangd":      console.log("[LS] Repsonse"); console.log(msg.body); break;
                case "worker":      handleWorkerMessage(msg);   break;
                default:            console.warn(`Unknown message target '${msg.target}' from worker.\nFull message:`); console.warn(msg);
            }
    });

    clangObj = {
        worker: clangWorker,
        compiler: compiler,
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


