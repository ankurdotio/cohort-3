import React, { useEffect } from 'react';
import io from "socket.io-client";
import { useDispatch, useSelector } from 'react-redux';

const ChatPage = () => {

    const { accessToken } = useSelector((state) => state.auth);

    return (
        <section className="chat-page">
            <div className="conversation-area">
                <div className="messages">
                    <div className="message incoming">Hello! This is a message.</div>
                    <div className="message outgoing">Hello! This is a message.</div>
                </div>
                <div className="input-area">
                    <input type="text" placeholder="Type a message..." />
                    <button type="button">Send</button>
                </div>
            </div>
        </section>
    );
};

export default ChatPage;