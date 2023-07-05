import { StdStream } from "./stdstream.mjs";

export class Clangd {
    module;
    stdin;
    stdout;
    stderr;

    constructor (module) {
        this.module = module;

        this.initStreams();
    }

    initStreams() {
        const stdin = new StdStream();

        const stdout = new StdStream();
        stdout.onPut = (char) => { this.stdoutOnPutHandler(char) };
        
        const stderr = new StdStream();
        stderr.onPut = (char) => {
            if (char === "\n") {
                const line = stderr.read();
                if (line.startsWith("E")) console.error(line);
                else console.log(line);
            }
        }

        this.module.FS.init(stdin.get, stdout.put, stderr.put);

        this.stdin = stdin;
        this.stdout = stdout;
        this.stderr = stderr;
    }

    //Handler for stdout. Processes LSP response messages as per the specification:
    //https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#baseProtocol

    _separator_ = ": ";
    _terminator_ = "\r\n";
    _fullTerminator = `${this._terminator_}${this._terminator_}`

    responseHeaders = {};
    contentReady = false;
    outBuffer = [];
    outBufferLen = 4;

    contentRemaining = 0;

    
    stdoutOnPutHandler(char) {
        if (this.contentReady) {
            this.contentRemaining--;
            
            if (this.contentRemaining == 0) {
                this.contentReady = false;
                const content = this.stdout.read();
                const response = JSON.parse(content);
                
                postMessage({
                    target: "clangd",
                    type: "response",
                    body: response
                })
            }
            return;
        }

        //Push to a small buffer of chars to check the most recent characters read
        if (this.outBuffer.length >= this.outBufferLen) this.outBuffer.shift();
        this.outBuffer.push(char);

        if(this.outBuffer.join('') === this._fullTerminator) {
            // console.log("All headers received. Reading content");

            this.stdout.clear()  //there shouldn't be any useful data left in the buffer

            //Prepare to read content
            if (!this.responseHeaders["Content-Length"]) console.error("Expected header 'Content-Length' was not found! Cannot continue reading LSP response");
            else {
                this.contentReady = true;
                this.contentRemaining = this.responseHeaders["Content-Length"];
            }
        }
        else if(this.outBuffer.slice(-2).join('') === this._terminator_) {
            this.stdout.buffer.pop();                   //pop \r\n separator
            this.stdout.buffer.pop();

            const header = this.stdout.read();
            // console.log(`Received Header: '${header}'`);
            
            const kvp = header.split(this._separator_);
            this.responseHeaders[kvp[0]] = kvp[1];
        }
    }
}