import { Socket } from "./WebSocket";


export class RTC {
    /**
      * @param {HTMLVideoElement} remoteVideoElement
      * @param {HTMLVideoElement} localVideoElement 
      */
    constructor(remoteVideoElement, localVideoElement) {
        /**
         * @type {RTCPeerConnection}
         */
        this.connection = null;
        this.socket = new Socket("ws://localhost:4444/");
        this.remoteVideoStream = null;
        this.remoteAudioTrack = null;
        this.id = null;
        /**
         * @type {MediaStream}
         */
        this.localStream = null;

        this.remoteVideoElement = remoteVideoElement;
        this.localVideoElement = localVideoElement;
        this.onMessage = this.onMessage.bind(this);
        this.createConnection = this.createConnection.bind(this);
        this.setRemoteVideoElement = this.setRemoteVideoElement.bind(this);
        ///socket handlers
        this.socket.attachHandlers({ onMessage: this.onMessage, onError: () => console.log("SOCKET CLOSED") })

    }

    setRemoteVideoElement(el) {
        this.remoteVideoElement = el;
    }

    onMessage(e) {
        const event = JSON.parse(e.data);
        console.log({ event })
        switch (event.type) {
            case "connect": {
                this.senderId = event.data.sender;
                break;
            }
            case "offer":
                this.handleOffer(event.data.sdp, event.data.sender);
                break;
            case "answer":
                this.handleAnswer(event.data.sdp);
                break;
            case "candidate":
                this.handleCandidate(event.data.candidate);
                break;
            case "ready":
                if (!this.connection) {
                    this.createConnection();
                }
                break;
            case "bye":
                if (this.connection) {
                    this.hangup();
                }
                break;
            case "connection":
                this.id = event.id;
                break;
            default:
                console.log("NO HANDLER FOR SUCH EVENT: ", event);
                break;
        }
    }


    addUser(userName) {
        this.username = userName;
        this.socket.sendMessage({ type: "user", data: { username: userName, id: this.id } })
    }


    async generateLocalTracks(localVideoElement) {
        const stream = await window.navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        this.localStream = stream;

        if (this.localStream) {
            localVideoElement.srcObject = this.localStream;
        }
    }

    createConnection() {
        this.connection = new RTCPeerConnection({
            iceServers: [
                {
                    url: 'turn:turn.anyfirewall.com:443?transport=tcp',
                    credential: 'webrtc',
                    username: 'webrtc'
                }
            ]
        });

        this.connection.onicecandidate = e => {
            const message = {
                type: "candidate",
            }

            if (e.candidate) {
                console.log("SENDER ID: ", this.senderId)
                message.data = {
                    candidate: {
                        candidate: e.candidate.candidate,
                        sdpMid: e.candidate.sdpMid,
                        sdpMLineIndex: e.candidate.sdpMLineIndex
                    },
                    id: this.id,
                    target: this.senderId
                }

                console.log({ message })
                this.socket.sendMessage(message);
            }

        }

        this.connection.ontrack = track => {
            console.log("new track", track, this.remoteVideoElement)
            if (track.streams[0] && this.remoteVideoElement) {
                this.remoteVideoElement.srcObject = track.streams[0];
            }
        };
        if (this.localStream)
            this.localStream.getTracks().forEach(track => this.connection.addTrack(track, this.localStream));

    }

    async startCall(calleeName) {
        this.createConnection();

        const offer = await this.connection.createOffer();
        this.socket.sendMessage({ type: "connect", data: { username: calleeName } })

        await this.connection.setLocalDescription(offer);
        this.socket.sendMessage({ type: "video-offer", data: { sdp: offer, name: calleeName, id: this.id } })
    }

    //handlers
    async handleOffer(offer, sender) {
        this.senderId = sender;
        this.createConnection();
        await this.connection.setRemoteDescription(offer);
        const answer = await this.connection.createAnswer();
        await this.connection.setLocalDescription(answer);
        this.socket.sendMessage({ type: "answer", sdp: answer, senderId: sender });

    }

    async handleAnswer(answer) {
        if (this.connection) {
            await this.connection.setRemoteDescription(answer);

        }
    }

    async handleCandidate(candidate) {
        if (this.connection) {
            await this.connection.addIceCandidate(candidate);
        }
    }

    hangup() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(x => x.stop());
            this.localStream = null;
            this.localVideoElement.srcObject = null;
        }
    }
}