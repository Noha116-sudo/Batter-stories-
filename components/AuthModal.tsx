
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { XMarkIcon, SparklesIcon } from './icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Get the current URL to tell Supabase where to redirect back to
      const redirectTo = window.location.origin;

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: redirectTo,
          }
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md p-8 rounded-none border border-zinc-200 dark:border-zinc-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-black dark:text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-black dark:hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {message ? (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 mb-6 border border-green-100 dark:border-green-800 text-sm">
            {message}
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white px-4 py-3 text-black dark:text-white transition-colors outline-none"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white px-4 py-3 text-black dark:text-white transition-colors outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <SparklesIcon className="w-5 h-5 animate-spin mr-2" /> : (isSignUp ? 'Join Now' : 'Enter Portal')}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 text-center">
          <p className="text-zinc-500 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 font-bold text-black dark:text-white hover:underline uppercase text-xs tracking-widest"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
