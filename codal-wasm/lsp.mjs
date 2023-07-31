export class LSPUtil {

    HTTPWrapper = (json) => {
        return `Content-Length: ${json.length}\r\n\r\n${json}`;
    }

    LSPCallWrapper = (method, params = {}) => {
        const json = {
            jsonrpc: "2.0",
            id: 1,
            method: method,
            params: params,
        }

        return JSON.stringify(json);
    }

    LSPNotifyWrapper = (method, params = {}) => {
        const json = {
            jsonrpc: "2.0",
            method: method,
            params: params,
        }

        return JSON.stringify(json);
    }
}