//Permission is hereby granted, free of charge, to any
//person obtaining a copy of this software and associated
//documentation files (the "Software"), to deal in the
//Software without restriction, including without
//limitation the rights to use, copy, modify, merge,
//publish, distribute, sublicense, and/or sell copies of
//the Software, and to permit persons to whom the Software
//is furnished to do so, subject to the following
//conditions:
//
//The above copyright notice and this permission notice
//shall be included in all copies or substantial portions
//of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
//SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
//OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
//IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//DEALINGS IN THE SOFTWARE.

//Code from https://github.com/jprendes/emception

import Process from "./Process.mjs";

export default class EmProcess extends Process {
    _module = null;
    _memory = null;

    _print = (...args) => console.log(...args);
    _printErr = (...args) => console.warn(...args);

    constructor(Module, {
        FS,
        onrunprocess,
        onprint,
        onprintErr,
        ...opts
    } = {}) {
        super({
            onrunprocess,
            onprint,
            onprintErr,
        });
        this.ready = this.#init(Module, FS, { onrunprocess, ...opts });

        let promise = this.ready.then(() => {
            delete this.then;
            return this;
        });
        this.then = (...args) => promise.then(...args);
    }

    #init = async (Module, FS, opts) => {
        const fsroot = FS && {
            ROOT: {
                type: "PROXYFS",
                opts: {
                    root: "/",
                    fs: FS,
                },
            }
        };
        this._module = await new Module({
            ...opts,
            ...fsroot,
            noInitialRun: true,
            noExitRuntime: true,
            print: (...args) => this._print(...args),
            printErr: (...args) => this._printErr(...args),
        });
        
        this._memory = this._module.HEAPU8.slice();

        if (fsroot) {
            // Do not cache nodes belonging to the PROXYFS mountpoint.
            const hashAddNode = this._module.FS.hashAddNode;
            this._module.FS.hashAddNode = (node) => {
                if (node.mount.mountpoint === "/") return;
                hashAddNode(node);
            }
        }

        this.#addErorCodeToErrnoError();
    }

    #addErorCodeToErrnoError = () => {
        const FS = this._module.FS;
        const ERRNO_CODES = Object.fromEntries(
            Object.entries(this._module.ERRNO_CODES)
                .map(([k, v]) => [v, k])
        );
        Object.defineProperty(FS.ErrnoError.prototype, "code", {
            get: function () {
                return ERRNO_CODES[this.errno];
            }
        });
    }

    get FS() {
        return this._module.FS;
    }

    _callMain(argc, argv) {
        return this._module._main(argc, argv);
    }

    async exec(args, opts = {}) {
        if ((typeof args) === "string") args = args.split(/ +/g);

        // Clang's driver uses global state, and this might not be the first time we run the module.
        // Reinitialize the memory to its initial state to reset the global state.
        this._module.HEAPU8.fill(0);
        this._module.HEAPU8.set(this._memory);

        // Allocate argv
        const argc = args.length;
        const argv = this._module._malloc((argc+1) * 4);
        const allocs = [argv];
        for (let i = 0; i < argc; i++) {
            const p = this._module.HEAP32[(argv >> 2) + i] = this._module.allocateUTF8(args[i]);
            allocs.push(p);
        }

        // Reserving memory
        this._module.HEAP32[(argv >> 2) + argc] = 0;

        let returncode = 0;
        const stdout = [];
        const stderr = [];

        this._print = (...args) => {
            this.onprint(...args);
            opts.print && opts.print(...args);
            stdout.push(...args);
        };
        this._printErr = (...args) => {
            this.onprintErr(...args);
            opts.printErr && opts.printErr(...args);
            stderr.push(...args);
        };

        try {
            if (opts.cwd) this.cwd = opts.cwd;
            returncode = await this._callMain(argc, argv);
        } catch (e) {
            if (typeof e === "number") {
                returncode = -84;
            } else if ("status" in e) {
                returncode = e.status;
            } else {
                console.log(e);
                returncode = -42;
            }
        } finally {
            allocs.forEach(p => this._module._free(p));
        }
        
        return {
            returncode,
            stdout: stdout.join("\n"),
            stderr: stderr.join("\n"),
        }
    }
};
