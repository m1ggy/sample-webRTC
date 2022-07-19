import WebSocket, { WebSocketServer } from "ws";
import express from "express";
import { randomUUID } from "crypto"
import { createServer } from "http"
const app = express();

const server = createServer(app);

const wss = new WebSocketServer({ server })
let connections = [];
let users = [];

function findExistingUser(username, id = null) {

    if (id) return users.find(x => x.id == id)
    return users.find(x => x.username == username)
}

/**
 * 
 * @param {string} id 
 * @returns {WebSocket}
 */
function findSocket(id) {
    return connections.find(con => con.id == id)?.socket;
}

wss.on("connection", (ws) => {
    console.log("new connection")
    const id = randomUUID({ disableEntropyCache: true })
    connections.push({ socket: ws, id });

    ws.send(JSON.stringify({ type: "connection", id }));

    ws.on("message", (e) => {
        const event = JSON.parse(e);
        const socket = ws;
        const socketId = id;
        switch (event.type) {
            case "user": {
                if (!findExistingUser(event.data)) {
                    users.push(event.data);
                }
                break;
            }
            case "connect": {
                console.log({ event })
                const user = findExistingUser(event.data.username);
                socket.send(JSON.stringify({ type: "connect", data: { sender: user.id } }));
                break;
            }
            case "video-offer": {
                const callee = findExistingUser(event.data.name);
                const sender = findExistingUser(null, event.data.id);
                if (callee) {
                    const calleeSocket = findSocket(callee.id);
                    if (calleeSocket) {
                        calleeSocket.send(JSON.stringify({
                            type: "offer",
                            data: {
                                sender: sender.id,
                                sdp: event.data.sdp
                            }
                        }))
                    }

                } else socket.send(JSON.stringify({ type: "error", data: "cannot find user" }))
                break;
            }
            case "candidate": {

                const sender = findSocket(event.data.target)

                if (sender) {
                    sender.send(JSON.stringify({ type: "candidate", data: { candidate: event.data.candidate } }))
                }
                break;
            }

            case "answer": {
                const sender = findSocket(event.senderId);

                if (sender) {
                    sender.send(JSON.stringify({ type: "answer", data: { sdp: event.sdp, sender: socketId } }))
                }
                break;
            }
        }
    })
})



server.listen(4444, () => {
    console.log("listening on port 4444");
})

