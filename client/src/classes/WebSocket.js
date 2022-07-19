export class Socket {
    constructor(url, id) {
        this.client = new WebSocket(url);
        this.id = id;

        this.client.onopen = () => {
            this.sendMessage({ type: "connection", id: this.id })
        }
    }

    /**
     * 
     * @param {{ onMessage: Function, onError: Function }} handlers 
     */
    attachHandlers(handlers) {
        this.client.onmessage = handlers.onMessage;
        this.client.onerror = handlers.onError;
    }

    /**
     * 
     * @param {string} message 
     */
    sendMessage(message) {
        if (this.client)
            this.client.send(JSON.stringify(message));
    }
}