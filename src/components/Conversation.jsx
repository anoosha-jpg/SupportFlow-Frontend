import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Shield, Wrench } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Conversation = ({ ticketId, ticketStatus }) => {
  const { user } = useAuth();
  const { socket, joinTicketRoom, leaveTicketRoom } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/tickets/${ticketId}/messages`);
        if (res.data.success && isMounted) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('[Conversation] Failed to load messages:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMessages();
    joinTicketRoom(ticketId);

    return () => {
      isMounted = false;
      leaveTicketRoom(ticketId);
    };
  }, [ticketId]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (msg) => {
      if (msg.ticket === ticketId || msg.ticket?._id === ticketId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('new-message', handleIncomingMessage);

    return () => {
      socket.off('new-message', handleIncomingMessage);
    };
  }, [socket, ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const res = await api.post(`/tickets/${ticketId}/messages`, {
        message: newMessage.trim()
      });
      if (res.data.success) {
        setNewMessage('');
      }
    } catch (err) {
      console.error('[Conversation] Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Shield size={14} className="role-icon admin" />;
    if (role === 'worker') return <Wrench size={14} className="role-icon worker" />;
    return <UserIcon size={14} className="role-icon customer" />;
  };

  return (
    <div className="conversation-container">
      <div className="conversation-header">
        <h3>Request Conversation</h3>
        <span className="live-indicator">
          <span className="pulse-dot"></span> Live Real-time Chat
        </span>
      </div>

      <div className="messages-list">
        {loading ? (
          <div className="chat-loading">
            <div className="spinner-sm"></div> Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">
            <p>No messages yet. Send a message to start communicating.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id === user._id || msg.sender === user._id;
            return (
              <div key={msg._id} className={`message-item ${isMe ? 'my-message' : 'other-message'}`}>
                <div className="message-bubble">
                  <div className="message-meta">
                    <span className="sender-name">
                      {getRoleIcon(msg.senderRole || msg.sender?.role)}
                      {msg.sender?.name || (isMe ? 'You' : 'Participant')}
                    </span>
                    <span className="sender-badge">{msg.senderRole || msg.sender?.role}</span>
                    <span className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="message-body">{msg.message}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="message-input-form">
        <input
          type="text"
          placeholder="Type your message here..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          className="chat-input"
        />
        <button type="submit" className="btn btn-primary send-btn" disabled={!newMessage.trim() || sending}>
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};

export default Conversation;
