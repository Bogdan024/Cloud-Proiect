import React, { useEffect, useState } from 'react';
import { loginUser, registerUser } from '../utils/messagesFunctions';
import Spinner from './Spinner';

const AuthComponent = () => {

  useEffect(() => {
    if (localStorage.getItem('token')) {
      window.location.href = '/liveChat';
    }
  }, []);

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="auth-container">
        <Spinner />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      
      if (isLogin) {
        console.log("Attempting login with:", { email, password: "******" });
        data = await loginUser(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        console.log("Attempting registration with:", { name, email, password: "******" });
        data = await registerUser(name, email, password);
      }
      
      console.log("Auth response:", data);
      
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      console.log("Data stored in localStorage");
      console.log("Redirecting to live chat page");
      
      window.location.href = '/liveChat';
    } catch (error) {
      console.error("Authentication error:", error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }

  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="switch-button"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AuthComponent;