import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { useDispatch, useSelector } from 'react-redux';

const ChatPage = () => {

    const { accessToken } = useSelector((state) => state.auth);
    const socketRef = useRef(null);
    const [ inputValue, setInputValue ] = useState("");
    const [ messages, setMessages ] = useState([]);

    function sendMessage(event) {
        event.preventDefault();
        socketRef.current.emit("message", {
            content: inputValue
        })
        setMessages((prevMessages) => [ ...prevMessages, { content: inputValue, outgoing: true } ]);
        setInputValue("");
    }

    useEffect(() => {
        const socket = io({
            extraHeaders: {
                Authorization: `Bearer ${accessToken}`
            }
        })

        socketRef.current = socket;

        socket.on("message", (msg) => {
            setMessages((prevMessages) => [ ...prevMessages, msg ]);
        })


        return () => {
            socket.disconnect();
        }

    }, [])

    return (
        <section className="chat-page">
            <div className="conversation-area">
                <div className="messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.outgoing ? "outgoing" : "incoming"}`}>{msg.content}
                        {msg.email ? <small>{msg.email}</small> : null}
                        </div>
                    ))}
                </div>
                <div className="input-area">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        type="text" placeholder="Type a message..." />
                    <button
                        onClick={sendMessage}
                        type="button">Send</button>
                </div>
            </div>
        </section>
    );
};

export default ChatPage;