import { useState, useRef, useEffect } from 'react';
import { editMessage, deleteMessage } from '../utils/messagesFunctions';

const MessageActions = ({ message, onMessageUpdated, onMessageDeleted, currentUserId, socket }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const menuRef = useRef(null);
  const editInputRef = useRef(null);
  
  const isOwnMessage = message.senderId === currentUserId;
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
  console.log('Socket in MessageActions:', socket);
}, [socket]);
  
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleEdit = () => {
    setIsEditing(true);
    setIsMenuOpen(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
    setError(null);
  };
  
  const handleSaveEdit = async () => {
    if (editContent.trim() === '') {
      setError('Message cannot be empty');
      return;
    }
    
    if (editContent === message.content) {
      setIsEditing(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedMessage = await editMessage(message._id, editContent, currentUserId);
      socket.emit('message_edited', {
      messageId: message._id,
      newContent: editContent,
      updatedAt: new Date()
    });
      setIsEditing(false);
      onMessageUpdated(updatedMessage);
    } catch (error) {
      setError('Failed to edit message. Please try again.');
      console.error('Error saving edit:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    setIsMenuOpen(false);
    
    if (window.confirm('Are you sure you want to delete this message?')) {
      setIsLoading(true);
      
      try {
        await deleteMessage(message._id, currentUserId);
        socket.emit('delete_message', {
        messageId: message._id,
        userId: currentUserId
      });
        onMessageDeleted(message._id);
      } catch (error) {
        setError('Failed to delete message. Please try again.');
        console.error('Error deleting message:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  if (!isOwnMessage) {
    return null;
  }
  
  return (
    <div className="message-actions">
      {isEditing ? (
        <div className="message-edit-container">
          <textarea
            ref={editInputRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="message-edit-input"
            disabled={isLoading}
          />
          
          {error && <div className="message-edit-error">{error}</div>}
          
          <div className="message-edit-buttons">
            <button 
              onClick={handleCancelEdit} 
              className="message-edit-cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveEdit} 
              className="message-edit-save"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="message-menu-container" ref={menuRef}>
          <button 
            onClick={toggleMenu} 
            className="message-menu-button"
            aria-label="Message options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
          
          {isMenuOpen && (
            <div className="message-menu">
              <button onClick={handleEdit} className="message-menu-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button onClick={handleDelete} className="message-menu-item message-menu-delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageActions;