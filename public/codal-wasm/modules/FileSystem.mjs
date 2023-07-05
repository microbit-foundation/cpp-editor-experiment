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

//Modified from https://github.com/jprendes/emception

import EmProcess from "./EmProcess.mjs";
import WasmPackageModule from "./wasm/wasm-package.mjs";
import BrotliProcess from "./BrotliProcess.mjs";
import createLazyFile from "./emscripten/createLazyFile.mjs"

export default class FileSystem extends EmProcess {
    _brotli = null;
    _cache = null;
    init = false;

    constructor({ cache = "/cache", ...opts } = {}) {
        super(WasmPackageModule, { ...opts });
        this.#init(cache, opts);
    }

    #init = async (cache, opts) => {
        await this;
        this._brotli = await new BrotliProcess({ FS: this.FS, ...opts});
        this._cache = (async () => {
            while (cache.endsWith("/")) {
                cache = cache.slice(0, -1);
            }
            if (this.exists(cache)) return cache;
            this.persist(cache);
            await this.pull();
            this.init = true;
            return cache;
        })();
    }

    async unpack(...paths) {
        return Promise.all(paths.flat().map(async (path) => {
            postMessage({
                target: "worker",
                type: "info",
                body: "Downloading root",
            })


            let file = await fetch(path);
            let buffer = new Uint8Array(await file.arrayBuffer());

            postMessage({
                target: "worker",
                type: "info",
                body: "Unpacking",
            })

            if (path.endsWith(".br")) {
                // it's a brotli file, decompress it
                await this.FS.writeFile("/tmp/archive.pack.br", buffer);
                
                // Ensure initialisation has happened (should await on wasm module here, but this can be difficult)
                while (this.init===false) {await new Promise(r => setTimeout(r, 10))};

                await this._brotli.exec(["brotli", "--decompress", "/tmp/archive.pack.br"], { cwd: "/tmp/" });
                await this.FS.unlink("/tmp/archive.pack.br");
            } else {
                await this.FS.writeFile("/tmp/archive.pack", buffer);
            }
            await this.exec(["wasm-package", "unpack", "/tmp/archive.pack"], { cwd: "/" });
            await this.FS.unlink("/tmp/archive.pack");
            
            //Brotli isnt used after this.S
        }));
    }

    async cachedLazyFile(path, size, md5, url) {
        const cache = await this._cache;

        if (this.exists(path)) {
            this.unlink(path);
        }
        if (this.exists(`${cache}/${md5}`)) {
            const data = this.readFile(`${cache}/${md5}`, {encoding: "binary"});
            this.writeFile(path, data);
        } else {
            const [, dirname = "", basename] = /(.*\/)?([^\/]*)/.exec(path);
            createLazyFile(this.FS, dirname, basename, size, url, true, false, async (data) => {
                this.writeFile(`${cache}/${md5}`, data);
                await this.push();
            });
        }
    }

    persist(path) {
        this.FS.mkdirTree(path);
        this.FS.mount(this.FS.filesystems.IDBFS, {}, path);
    }

    exists(path) {
        return this.analyzePath(path).exists;
    }
    analyzePath(...args) {
        return this.FS.analyzePath(...args)
    }
    mkdirTree(...args) {
        return this.FS.mkdirTree(...args)
    }
    mkdir(...args) {
        return this.FS.mkdir(...args)
    }
    unlink(...args) {
        return this.FS.unlink(...args)
    }
    readFile(...args) {
        return this.FS.readFile(...args)
    }
    writeFile(...args) {
        return this.FS.writeFile(...args)
    }

    pull() {
        return new Promise((resolve, reject) => this.FS.syncfs(true, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        }));
    }

    push() {
        return new Promise((resolve, reject) => this.FS.syncfs(false, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        }));
    }
};
