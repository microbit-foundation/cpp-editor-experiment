import text from "./microbit-test.hex"

export interface Compiler {
    compile() : Promise<boolean>

    getHex() : Promise<string>
}

export class CODALCompiler implements Compiler {

    async compile() : Promise<boolean> {
        //if compilation fails throw a compilation error
        console.log("[CODAL] compilation success");
        return true;
    }

    async getHex() : Promise<string> {
        return fetch(text)
        .then(t => t.text())
        .then(t => {return t})
    }
}