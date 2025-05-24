// components/LiveChatComponent.js
import React, { useState, useEffect, useRef } from 'react';
import MessageActions from './MessageActions';
import {
  getMessages,
  formatLastSeen,
  connectWebSocket,
  sendAuthMessage,
  sendChatMessage,
  sendReadReceipt,
  sendTypingIndicator,
} from '../utils/messagesFunctions';

const LiveChatComponent = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const selectedUserRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedMessage, setSelectedMessage] = useState(null);


  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize user data and socket.io connection once
  useEffect(() => {
    const initChat = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (!storedUser || !storedToken) {
        window.location.href = '/';
        return;
      }
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);

        const socket = await connectWebSocket();

        socket.on('connect', () => {
          console.log('Socket.IO connected');
          sendAuthMessage(socket, storedToken);
        });

        socket.on('users', (data) => {
          const filtered = data.filter((u) => u._id !== userData._id);
          setUsers(filtered);
          setLoading(false);
        });

        socket.on('user_status', ({ userId, isOnline }) => {
          setUsers((prev) =>
            prev.map((u) => (u._id === userId ? { ...u, isOnline } : u))
          );
        });

        socket.on('message', ({ message }) => {
          const sel = selectedUserRef.current;
          if (
            sel &&
            ((message.senderId === userData._id && message.receiverId === sel._id) ||
              (message.senderId === sel._id && message.receiverId === userData._id))
          ) {
            setMessages((prev) => [...prev, message]);
            if (message.senderId === sel._id) {
              sendReadReceipt(socket, sel._id, userData._id);
            }
          }
        });

        socket.on('message_sent', ({ message }) => {
          const sel = selectedUserRef.current;
          if (
            sel &&
            message.senderId === userData._id &&
            message.receiverId === sel._id
          ) {
            setMessages((prev) => [...prev, message]);
          }
        });

        socket.on('messages_read', ({ senderId, receiverId }) => {
          const sel = selectedUserRef.current;
          if (
            sel &&
            senderId === userData._id &&
            receiverId === sel._id
          ) {
            setMessages((prev) =>
              prev.map((m) =>
                m.senderId === userData._id && m.receiverId === sel._id
                  ? { ...m, read: true }
                  : m
              )
            );
          }
        });

        socket.on('message_edited', ({ messageId, newContent, updatedAt }) => {
  setMessages(prev => 
    prev.map(m => m._id === messageId 
      ? { ...m, content: newContent, isEdited: true, updatedAt: new Date(updatedAt) } 
      : m
    )
  );
});
socket.on('message_deleted', ({ messageId }) => {
  setMessages(prev => prev.filter(m => m._id !== messageId));
});

        socket.on('typing', ({ senderId }) => {
          const sel = selectedUserRef.current;
          if (sel && senderId === sel._id) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000);
          }
        });

        socket.on('disconnect', (reason) => {
          console.log('Socket.IO disconnected:', reason);
        });

        socketRef.current = socket;
      } catch (err) {
        console.error('Error initializing chat:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    };

    initChat();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Load messages when selecting a user to
  useEffect(() => {
    if (!selectedUser || !user) return;
    selectedUserRef.current = selectedUser;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const msgs = await getMessages(user._id, selectedUser._id);
        setMessages(Array.isArray(msgs) ? msgs : []);
        if (socketRef.current) {
          sendReadReceipt(socketRef.current, selectedUser._id, user._id);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [selectedUser, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUserSelect = (u) => {
    selectedUserRef.current = u;
    setSelectedUser(u);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !socketRef.current || !selectedUser || !user) return;
    sendChatMessage(socketRef.current, {
      senderId: user._id,
      receiverId: selectedUser._id,
      content: messageText.trim(),
    });
    setMessageText('');
  };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (e.target.value.trim() && socketRef.current && selectedUser && user) {
      sendTypingIndicator(socketRef.current, user._id, selectedUser._id);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineUsers = filteredUsers.filter((u) => u.isOnline);
  const offlineUsers = filteredUsers.filter((u) => !u.isOnline);

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Chat with your friends</h1>
        <div className="user-info">
          <span>{user.name}</span>
          <button onClick={logout} className="logout-btn">
            Log Out
          </button>
        </div>
      </div>
      <div className="chat-main">
        {/* Sidebar */}
        <div className="users-sidebar">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search users..."
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="user-groups">
            <h2>Online Users</h2>
            <div className="user-list">
              {onlineUsers.map((u) => (
                <div
                  key={u._id}
                  className={`user-item ${selectedUser?._id === u._id ? 'selected' : ''}`}
                  onClick={() => handleUserSelect(u)}
                >
                  <div className="user-avatar online">{u.name.charAt(0)}</div>
                  <div className="user-details">
                    <div className="user-name">{u.name}</div>
                    <div className="user-status">Online</div>
                  </div>
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <div className="no-users">No users online</div>
              )}
            </div>
            <h2>Offline Users</h2>
            <div className="user-list">
              {offlineUsers.map((u) => (
                <div
                  key={u._id}
                  className={`user-item ${selectedUser?._id === u._id ? 'selected' : ''}`}
                  onClick={() => handleUserSelect(u)}
                >
                  <div className="user-avatar offline">{u.name.charAt(0)}</div>
                  <div className="user-details">
                    <div className="user-name">{u.name}</div>
                    <div className="user-status">{formatLastSeen(u.lastSeen)}</div>
                  </div>
                </div>
              ))}
              {offlineUsers.length === 0 && (
                <div className="no-users">No users offline</div>
              )}
            </div>
          </div>
        </div>
        {/* Chat Area */}
        <div className="messages-area">
          {selectedUser ? (
            <>
              <div className="chat-user-header">
                <div className="user-avatar">
                  {selectedUser.name.charAt(0)}
                </div>
                <div className="user-details">
                  <div className="user-name">{selectedUser.name}</div>
                  <div className="user-status">
                    {selectedUser.isOnline
                      ? 'Online'
                      : formatLastSeen(selectedUser.lastSeen)}
                  </div>
                </div>
              </div>
              <div className="messages-container">
                {loading ? (
                  <div className="loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="no-messages">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m._id}
                      className={`message ${
                        m.senderId === user._id ? 'sent' : 'received'
                      }`}
                      onDoubleClick={() => setSelectedMessage(m)}
                    >
                      {/* Conditionally render MessageActions */}
                      {selectedMessage?._id === m._id && (
                        <MessageActions
                          message={m}
                          currentUserId={user._id}
                          onMessageUpdated={(updatedMessage) => {
                            setMessages((prev) =>
                              prev.map((msg) =>
                                msg._id === updatedMessage._id ? updatedMessage : msg
                              )
                            );
                            setSelectedMessage(null);
                          }}
                          onMessageDeleted={(deletedId) => {
                            setMessages((prev) => prev.filter((msg) => msg._id !== deletedId));
                            setSelectedMessage(null);
                          }}
                        />
                      )}
                      <div className="message-content">{m.content} </div>
                      <div className="message-time">
                        {m.isEdited ? (
    // If the message was edited, show "Edited" and the updated time
                          <>
                            Edited {new Date(m.updatedAt || m.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {m.senderId === user._id && (
                              <span className={`read-status ${
                                m.read ? 'read' : 'unread'
                              }`}>✓✓</span>
                            )}
                          </>
                        ) : (
                          // If not edited, show the original timestamp
                          <>
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {m.senderId === user._id && (
                              <span className={`read-status ${
                                m.read ? 'read' : 'unread'
                              }`}>✓✓</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="typing-indicator">
                    <span>{selectedUser.name} is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="message-input-container">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  disabled={loading}
                  className="message-input"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || loading}
                  className="send-button"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="select-user-prompt">
              Select a user to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveChatComponent;
