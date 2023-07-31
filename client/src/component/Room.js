import React, { useCallback, useEffect, useState } from "react"
import { useSocket } from "../context/socketProvider";
import ReactPlayer from "react-player"
import { Link, useLocation } from "react-router-dom"
import peer from "../service/peer";

function RoomPage(props) {

    const socket = useSocket()
    const location = useLocation()

    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [myStream, setMyStream] = useState('')
    const [remoteStream, setRemoteStream] = useState('')
    const [copy, setcopy] = useState(false)
    const [connectEmail, setConnectEmail] = useState("")

    const handlerUserJoined = useCallback((data) => {
        const { email, id } = data
        setRemoteSocketId(id)
        console.log(`Email: ${email}`)
        setConnectEmail(email)
    }, [])

    const handlerCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        })
        const offer = await peer.getOffer()
        socket.emit("user:call", { to: remoteSocketId, offer })
        setMyStream(stream)
    }, [socket, remoteSocketId])

    const handlerIncomingCall = useCallback(async (data) => {
        const { from, offer } = data
        setRemoteSocketId(from)
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        })
        setMyStream(stream)
        console.log('incoming call: ', from, offer)
        const ans = await peer.getAnswer(offer)
        socket.emit("call:accepted", { to: from, ans })
    }, [socket])

    const sendStream = useCallback(() => {
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream)
        }
    }, [myStream])

    const handlerCallAccepted = useCallback(({ from, ans }) => {
        peer.setLocalDescription(ans)
        console.log("call Accepted: ", from)
        sendStream()
    }, [sendStream])

    const handlerNegoNeeded = useCallback(async (ev) => {
        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed', { offer, to: remoteSocketId })
    }, [socket, remoteSocketId])

    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handlerNegoNeeded)
        return () => {
            peer.peer.removeEventListener("negotiationneeded", handlerNegoNeeded)
        }
    }, [handlerNegoNeeded])

    const handlerNegoNeedImcoming = useCallback(async ({ from, offer }) => {
        const ans = await peer.getAnswer(offer)
        socket.emit("peer:nego:done", { to: from, ans })
    }, [socket])

    const handlerNegofinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans)
    }, [])

    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
            const remoteStream = ev.streams
            console.log('get track!!')
            setRemoteStream(remoteStream[0])
        })
    }, [])

    const RoomID = (location.pathname).slice(6)

    let toggelCopy
    const copyHandler = () => {
        navigator.clipboard.writeText(RoomID)
        setcopy(true)
        toggelCopy = setTimeout(() => {
            setcopy(false)
        }, 10000)
    }

    useEffect(() => {
        socket.on("user:joined", handlerUserJoined)
        socket.on("incoming:call", handlerIncomingCall)
        socket.on("call:accepted", handlerCallAccepted)
        socket.on("peer:nego:needed", handlerNegoNeedImcoming)
        socket.on("peer:nego:final", handlerNegofinal)
        return () => {
            socket.off("user:joined", handlerUserJoined)
            socket.off("incoming:call", handlerIncomingCall)
            socket.off("call:accepted", handlerCallAccepted)
            socket.off("peer:nego:needed", handlerNegoNeedImcoming)
            socket.off("peer:nego:final", handlerNegofinal)
            clearTimeout(toggelCopy)
        }
    }, [socket, handlerUserJoined, handlerIncomingCall, handlerCallAccepted, handlerNegoNeedImcoming, handlerNegofinal, toggelCopy])

    const stopBothStream = async(stream) =>{
        await stream.getTracks().forEach(element => {
            if(element.readyState === 'live'){
                element.stop()
            }
        });
        window.location.reload()

    }

    const callCutHandler = () => {
        socket.off("user:joined", handlerUserJoined)
        socket.off("incoming:call", handlerIncomingCall)
        socket.off("call:accepted", handlerCallAccepted)
        socket.off("peer:nego:needed", handlerNegoNeedImcoming)
        socket.off("peer:nego:final", handlerNegofinal)
        stopBothStream(myStream)
        clearTimeout(toggelCopy)
        setMyStream("")
        setRemoteSocketId(null)
        setRemoteStream('')
        setConnectEmail("")
        
    }


    return (
        <div className="container-fluid" style={{ backgroundImage: "url('https://www.pixelstalk.net/wp-content/uploads/images6/Aesthetic-Wallpaper-White-Wallpaper-Cloud.jpg')", backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed" }}>
            <div className="row">
                <div className="col-12">
                    <h4 className="fw-bolder">Room ID: {RoomID}
                        <i onClick={copyHandler} className={`col-2 bi bi-clipboard${(copy) ? "-check-fill" : ""}`} style={{ cursor: "copy" }}></i>
                    </h4>
                    <h5>
                        <Link className="text-decoration-none" onClick={async () => {
                            setMyStream('')
                            setRemoteStream('')
                        }} to="/"><i class="bi bi-house-door">Home</i></Link>
                    </h5>
                </div>
                <div className="col-12 justify-content-center">
                    <div className="container row m-auto">
                        <div className="col-12 row m-2 my-3">
                            {
                                (remoteSocketId) ? <h2 className="text-center col-12">Connected {(connectEmail) ? `to ${connectEmail}` : ""}</h2> : <h2>No one in room</h2>
                            }
                            <div className="text-center">
                                {
                                    (remoteSocketId) ?
                                        <button className="btn me-2 btn-outline-success" onClick={handlerCallUser}><i class="bi bi-telephone-forward"></i> Call</button>
                                        : ""
                                }
                                {
                                    (myStream) ?
                                        <button className="btn me-2 btn-outline-success" onClick={sendStream}><i class="bi bi-telephone"></i> Call Accept</button>
                                        : ""
                                }
                                {
                                    (remoteSocketId && myStream) ?
                                        <button onClick={callCutHandler} className="btn btn-outline-danger ">
                                            <i class="bi bi-telephone-x"></i> Call Cut
                                        </button> : ""
                                }
                            </div>
                        </div>
                        <div className="col-12 row border border-2 border-dark rounded rounded-4">
                            <div className="d-flex my-3 justify-content-start" style={{ height: "30px", margin: "0px", borderBottom: "black 2px solid" }}>
                                <div className="bg-danger ms-1 rounded rounded-pill" style={{ height: "15px", width: "15px" }}></div>
                                <div className="bg-warning ms-1 rounded rounded-pill" style={{ height: "15px", width: "15px" }}></div>
                                <div className="bg-success ms-1 rounded rounded-pill" style={{ height: "15px", width: "15px" }}></div>
                            </div>
                            {
                                myStream ? <div className="col-12 col-sm-6 text-center">
                                    <h2>
                                        Your Video
                                    </h2>
                                    <ReactPlayer playing url={myStream} height="400px" width="100%" />
                                </div> : ""
                            }
                            {
                                remoteStream ? <div className="col-12 col-sm-6 text-center">
                                    <h2>
                                        Meet with
                                    </h2>
                                    <ReactPlayer playing url={remoteStream} height="400px" width="100%" />
                                </div> : ""
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomPage;