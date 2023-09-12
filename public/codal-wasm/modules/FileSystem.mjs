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
import BusyBoxModule from "./wasm/busybox_unstripped.mjs";

export default class FileSystem extends EmProcess {
    _cache = null;
    init = false;

    constructor({ cache = "/cache", ...opts } = {}) {
        super(BusyBoxModule, { ...opts });
        this.#init(cache, opts);
    }

    #init = async () => {
        await this;
        this.init = true;
    }

    async unpack(onProgress = (progress)=>{}, ...paths) {
        return Promise.all(paths.flat().map(async (path) => {
            const response = await fetch(path);
            const buffer = await this.getContent(response, onProgress);

            if (path.endsWith(".xz")) {
                // it's an xz file, decompress it
                await this.FS.writeFile("/tmp/archive.tar.xz", buffer);

                // Ensure initialisation has happened (should await on wasm module here, but this can be difficult)
                while (this.init===false) {await new Promise(r => setTimeout(r, 10))};
                
                // Use the "-k" flag to keep the compressed archive so we can remove ourselves.
                await this.exec(["busybox", "xz", "-k", "-d", "archive.tar.xz"], { cwd: "/tmp/" });
                await this.delete("/tmp/archive.tar.xz");
            } else {
                await this.FS.writeFile("/tmp/archive.tar", buffer);
            }
            await this.exec(["busybox", "tar", "xvf", "/tmp/archive.tar"], { cwd: "/" });
            await this.delete("/tmp/archive.tar");
        }));
    }
    
    //https://javascript.info/fetch-progress
    async getContent(response, onProgress = (progress)=>{}) {
        const contentLengthHeader = response.headers.get('Content-Length')
        let contentLength = +contentLengthHeader;
        if (contentLength === 0) contentLength = 27898426;  //hacky fallback to still display some kind of progress to the user even if content-length is missing

        const reader = response.body.getReader();

        if(!contentLengthHeader) console.warn("Content Length Header is missing, using fallback download size (may be inaccurate)");
        console.log(`Download Size: ${contentLength}`);

        let receivedLength = 0; // received that many bytes at the moment
        let chunks = []; // array of received binary chunks (comprises the body)
        while(true) {

            const {done, value} = await reader.read();

            if (done) {
                break;
            }

            chunks.push(value);
            receivedLength += value.length;
            onProgress(Math.min(receivedLength / contentLength, 1));
        }

        let chunksAll = new Uint8Array(receivedLength);
        let position = 0;

        for(let chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
        }

        return chunksAll
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
    delete(...args){
        this.FS.analyzePath(...args).object.contents = null;
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
