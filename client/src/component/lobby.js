import React, { useCallback, useEffect, useState } from "react"
import { useSocket } from "../context/socketProvider"
import { useNavigate } from "react-router-dom"
import {v1 as uuidV1} from "uuid"

function Lobbypage(props) {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [room, setRoom] = useState('')
    const [uniqueID, setuniqueID] = useState('')
    const [copy, setcopy] = useState(false)

    const socket = useSocket()

    const submitHandler = useCallback((e) => {
        e.preventDefault()
        socket.emit("room:join", { email, room })
    }, [socket, email, room])

    const handlerRoomJoin = useCallback((data) => {
        const { room } = data
        navigate(`/room/${room}`)
    },[navigate])

    let toggelCopy

    useEffect(() => {
        setuniqueID(uuidV1())
        console.log(uniqueID)
        socket.on("room:join", data => {
            console.log(`to backend: `, data)
            handlerRoomJoin(data)
        }, [socket])
        return () => {
            socket.off("room:join")
            clearTimeout(toggelCopy)
        }
    },[handlerRoomJoin, socket, toggelCopy, uniqueID ])

    const copyHandler = () =>{
        navigator.clipboard.writeText(uniqueID)
        setRoom(uniqueID)
        setcopy(true)
        toggelCopy = setTimeout(()=>{
            setcopy(false)
        },10000)
    }

    return (
        <div style={{ height: "100vh", width: "100vw", backgroundImage: "url('https://images.pexels.com/photos/4031818/pexels-photo-4031818.jpeg')", backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed" }}>
            <div className="position-absolute top-50 start-50 translate-middle">
                <h1 className="text-center fw-bolder" style={{ WebkitTextStroke: "2px #282828", textShadow: "0 9px 15px #262626", color: "white" }}>
                    Welcome To <span className="fw-bolder" style={{ fontSize: "150%", backgroundImage: "url('https://as1.ftcdn.net/v2/jpg/05/00/40/34/1000_F_500403491_QdfkWdTIe0CAbQ0tlJum4kwcCAaNtl9D.jpg')", backgroundSize: "cover", backgroundClip: "text", WebkitBackgroundClip: "text", fontFamily: "cursive", color: "transparent" }}>VIOLENT UJJWAL</span> Meet App
                </h1>
                <form className="row  mt-5" onSubmit={submitHandler}>
                    <div className="col-12 col-md-6">
                        <div className="text-center">
                            <label className="form-label fw-bolder" htmlFor="email">Enetr your email</label>
                        </div>
                        <input className="form-control border border-dark rounded rounded-pill px-4" type="email" onChange={(e) => { setEmail(e.target.value) }} name="email" placeholder="Enter Your Email" value={email} required />
                    </div>
                    <div className="col-12 col-md-6">
                        <div className="text-center">
                            <label className="form-label fw-bolder" htmlFor="room">Enetr room id</label>
                        </div>
                        <input className="form-control border border-dark rounded rounded-pill px-4" type="text" onChange={(e) => { setRoom(e.target.value) }} name="room" value={room} placeholder="Enter Room ID" required />
                    </div>
                    <div className="col-12 mt-3 border border-dark rounded rounded-lg-pill bg-secondary row overflow-hidden">
                        <div className="text-center">
                            <h5 className="form-label fw-bolder text-decoration-underline" htmlFor="room">If you can create a new room so you can use this room id</h5>
                        </div>
                        <div className="d-flax text-light">
                                <input className="col-10 border-0 bg-secondary fw-bold text-light text-center" type="text" name="room" value={uniqueID} disabled={true} />
                                <i onClick={copyHandler} className={`col-2 bi bi-clipboard${(copy)?"-check-fill":""}`} style={{cursor:"copy", fontSize:"20px"}}></i>
                        </div>
                    </div>
                    <div className="col-12 mt-3 text-center">
                        <button className="btn btn-primary" type="submit">Join</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Lobbypage;