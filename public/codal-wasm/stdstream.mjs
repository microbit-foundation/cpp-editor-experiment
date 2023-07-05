export class StdStream {
    buffer = [];

    onPut = (char) => {
        console.log(char)
    }

    write(data) {
        for (let i=0; i<data.length; i++){
            this.buffer.push(data[i]);
        }
    }

    read() {
        const bufStr = this.buffer.join('');
        this.clear()
        return bufStr;
    }

    get = () => {
        if (this.buffer.length == 0) return null
        const c = this.buffer.shift().charCodeAt(0);
        return c;
    }
    
    put = (byte) => {
        const char = String.fromCharCode(byte);
        this.buffer.push(char);
        this.onPut(char);
    }

    clear() {
        this.buffer = [];
    }

    close() {
        //
    }
}