import {
	AbstractMessageReader, DataCallback, AbstractMessageWriter, Message, Disposable, Emitter,
    MessageReader, MessageWriter
} from 'vscode-jsonrpc';

/*
*   Modified implementation of the BrowserMessageReader & BrowserMessageWriter classes from vscode-jsonrpc/browser
*   https://github.com/microsoft/vscode-languageserver-node/blob/main/jsonrpc/src/browser/main.ts
*   
*   Our worker handles more than just language server communication and so communicating directly through postMessage() is not sufficient.
*   The option to specify the structure of the incomming and outgoing messages is required to avoid conflicts with other areas of the worker.
* 	This simply boils down to being able to append the message to a given JS object before sending it and reading the message back from a 
*   specified property name of the received object.
*/

export class WorkerStructuredMessageReader extends AbstractMessageReader implements MessageReader {

	private _onData: Emitter<Message>;
	private _messageListener: (event: MessageEvent) => void;

	public constructor(private worker: Worker, private messagePropName : string) {
		super();
		this._onData = new Emitter<Message>();
		this._messageListener = (event: MessageEvent) => {
			this._onData.fire(event.data[messagePropName]);
		};
		worker.addEventListener('error', (event) => this.fireError(event));
		worker.onmessage = this._messageListener;
	}

	public listen(callback: DataCallback): Disposable {
		return this._onData.event(callback);
	}
}

export class WorkerStructuredMessageWriter extends AbstractMessageWriter implements MessageWriter {

	private errorCount: number;
    private structure : {};

	public constructor(private worker: Worker, structure : {}, private messagePropName : string) {
		super();
		this.errorCount = 0;
        this.structure = Object.freeze(structure);
		worker.addEventListener('error', (event) => this.fireError(event));
	}

	public write(msg: Message): Promise<void> {
		try {
            const msgObject = {
                ...this.structure,
                [this.messagePropName]: msg
            };
			this.worker.postMessage(msgObject);
			return Promise.resolve();
		} catch (error) {
			this.handleError(error, msg);
			return Promise.reject(error);
		}
	}

	private handleError(error: any, msg: Message): void {
		this.errorCount++;
		this.fireError(error, msg, this.errorCount);
	}

	public end(): void {
	}
}