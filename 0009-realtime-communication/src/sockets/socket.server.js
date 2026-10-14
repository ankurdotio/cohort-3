import { Server } from "socket.io"

export default function initializeSocket(httpServer) {
    const io = new Server(httpServer)

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id)

        socket.on("elon", (msg) => {
            console.log(msg)
            socket.broadcast.emit("musk","hello from server via socket")
        })

        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id)
        })

    })
}