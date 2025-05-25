import { io } from 'socket.io-client';

export const getUsers = async () => {
  try {
    console.log(`${window.location.origin}/api/users`);
    const response = await fetch(`${window.location.origin}/api/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export async function getMessages(senderId, receiverId) {
  const res = await fetch(
    `${window.location.origin}/api/messages?senderId=${encodeURIComponent(senderId)}&receiverId=${encodeURIComponent(receiverId)}`
  );
  if (!res.ok) {
    throw new Error(`Could not fetch messages: ${res.status}`);
  }
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : json;
}

export const editMessage = async (messageId, content, userId) => {
  try {
    const response = await fetch(`${window.location.origin}/api/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content,
        userId 
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error response:', errorData);
      throw new Error(`Failed to edit message: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId, userId) => {
  try {
    const response = await fetch(`${window.location.origin}/api/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error response:', errorData);
      throw new Error(`Failed to delete message: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const getMessage = async (messageId) => {
  try {
    const response = await fetch(`${window.location.origin}/api/${messageId}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error response:', errorData);
      throw new Error(`Failed to get message: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting message:', error);
    throw error;
  }
};


export const markMessagesAsRead = async (senderId, receiverId) => {
  try {
    const response = await fetch(`${window.location.origin}/api/messages`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ senderId, receiverId }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
};

export const loginUser = async (email, password) => {
  try {
    console.log("Sending login request");
    const response = await fetch(`${window.location.origin}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log("Login response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    console.log("Login successful, token received");
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
export const registerUser = async (name, email, password) => {
  try {
    console.log("Sending registration request");
    const response = await fetch(`${window.location.origin}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    
    console.log("Registration response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    
    const data = await response.json();
    console.log("Registration successful, token received");
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Never';
  
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now - lastSeenDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

let socket = null;

export async function connectWebSocket() {
  await fetch(`${window.location.origin}/api/socket`);
  socket = io();
  return socket;
}

export function sendAuthMessage(socket, token) {
  socket.emit('authenticate', { token });
}

export function sendChatMessage(socket, message) {
  socket.emit('message', message);
}

export function sendReadReceipt(socket, senderId, receiverId) {
  socket.emit('read_messages', { senderId, receiverId });
}

export function sendTypingIndicator(socket, senderId, receiverId) {
  socket.emit('typing', { senderId, receiverId });
}

export const notifyMessageEdit = (socket, messageData) => {
  socket.emit('edit_message', messageData);
}

export const notifyMessageDelete = (socket, messageData) => {
  socket.emit('delete_message', messageData);
}