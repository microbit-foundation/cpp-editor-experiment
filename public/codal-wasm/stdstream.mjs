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

    flag = false;
    get = async () => {
        if(this.flag) {
            // Pause completely until something enters the stream.
            while (this.buffer.length === 0) await new Promise(resolve => setTimeout(resolve, 4));
            this.flag = false;
        }
        // If the buffer is empty, return ETX. This is handled later on.
        if (this.buffer.length === 0) {
            this.flag = true;
            return ETX;
        }
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