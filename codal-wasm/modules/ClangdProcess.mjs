import EmProcess from "./EmProcess.mjs";

import ClangdModule from "./emscripten/clangd.mjs";


export default class LlvmBoxProcess extends EmProcess {
    constructor(opts) {
        const wasmBinary = opts.FS.readFile("/wasm/clangd.wasm");
        super(ClangdModule, { ...opts, wasmBinary });
    }
};
