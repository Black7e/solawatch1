import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import authService from '../services/authService';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('loading');
        setMessage('Completing authentication...');
        
        const user = await authService.handleCallback();
        
        if (user) {
          setStatus('success');
          setMessage(`Welcome back, ${user.name}!`);
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          throw new Error('Failed to authenticate user');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
        
        // Redirect to home page after error
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
    }
  };

  return (
    <div className="min-h-screen bg-x-bg flex items-center justify-center">
      <div className="bg-x-bg-secondary border border-x-border rounded-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {getStatusIcon()}
          <h2 className={`text-xl font-bold mt-4 ${getStatusColor()}`}>
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Authentication Successful'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
          <p className="text-x-text-secondary mt-2">
            {message}
          </p>
          {status === 'loading' && (
            <p className="text-sm text-x-text-secondary mt-4">
              Please wait while we complete your sign-in...
            </p>
          )}
          {status === 'success' && (
            <p className="text-sm text-x-text-secondary mt-4">
              Redirecting you to the home page...
            </p>
          )}
          {status === 'error' && (
            <div className="mt-4">
              <button
                onClick={() => navigate('/')}
                className="bg-x-purple hover:bg-x-purple-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Return to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 