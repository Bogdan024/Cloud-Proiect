// pages/liveChat.jsx
import React, { useEffect, useState } from 'react';
import LiveChatComponent from '../../components/LiveChatComponent';

export default function LiveChat() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log("Auth check - token exists:", !!token);
    console.log("Auth check - user exists:", !!user);
    
    if (!token || !user) {
      console.log("Not authenticated, redirecting to auth page");
      window.location.href = '/';
    } else {
      console.log("Authentication successful");
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);
  if (isLoading) {
    return <div className="loading">Loading authentication...</div>;
  }
  if (!isAuthenticated) {
    return <div className="loading">Authentication required, please wait...</div>;
  }
  return <LiveChatComponent />;
}