import React, { useContext, useRef } from 'react'
import RTCContext from '../contexts/RTCContext'



const Dashboard = () => {

    const context = useContext(RTCContext);
    console.log(context)
    const userNameRef = useRef("");
    const calleeRef = useRef("");
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const onClick = async () => {
        const name = userNameRef.current.trim();
        const calleeName = calleeRef.current.trim();
        if (!name) return;
        context.RTCClient.addUser(name);
        await context.RTCClient.generateLocalTracks(localVideoRef.current);
        context.RTCClient.setRemoteVideoElement(remoteVideoRef.current);
        if (calleeName) {
            context.RTCClient.startCall(calleeName);
        }
    }
    return (
        <div>
            <div>
                <p>Your Username</p>
                <input onChange={({ target: { value } }) => userNameRef.current = value} />
                <p>Callee Username (leave empty to start a room)</p>
                <input onChange={({ target: { value } }) => calleeRef.current = value} />
                <br></br>
                <button onClick={onClick} style={{ marginTop: "20px" }}>Start</button>
            </div>

            <div>
                <p>Local Video</p>
                <video ref={localVideoRef} width={500} height={250} autoPlay />
                <p>Remote Video</p>
                <video ref={remoteVideoRef} width={500} height={250} autoPlay />
            </div>
        </div>
    )
}

export default Dashboard