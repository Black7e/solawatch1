import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { signIn, loading } = useAuth();

  const handleSignInWithX = async () => {
    try {
      await signIn();
      // The modal will close automatically when the user is redirected
    } catch (error) {
      console.error('Sign in failed:', error);
      // You could show an error message here
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-x-bg-secondary border border-x-border rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-x-text">Sign In to SolaWatch</h2>
          <button
            onClick={onClose}
            className="text-x-text-secondary hover:text-x-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-x-text-secondary text-sm">
            Sign in to access advanced features, save your preferences, and share your insights with the community.
          </p>

          <button
            onClick={handleSignInWithX}
            disabled={loading}
            className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8] disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <X className="w-5 h-5" />
            )}
            {loading ? 'Signing in...' : 'Continue with X'}
          </button>

          <div className="text-xs text-x-text-secondary text-center">
            By signing in, you agree to our{' '}
            <a href="#" className="text-x-purple hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-x-purple hover:underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 