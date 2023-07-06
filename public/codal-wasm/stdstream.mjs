// End of file constant.
const ETX = 3;
export class StdStream {
    buffer = [];

    onPut = (char) => {
        console.log(char)
    }

    write(data) {
        this.buffer = this.buffer.concat([...data]);
    }

    read() {
        const bufStr = this.buffer.join('');
        this.clear()
        return bufStr;
    }

    get = async () => {
        while (this.buffer.length === 0) await new Promise(resolve => setTimeout(resolve, 4));
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
        this.buffer = ['\0'];
    }
}