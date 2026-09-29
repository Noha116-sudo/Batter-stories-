
import React from 'react';
import { MenuIcon, UserGroupIcon } from './icons';

interface HeaderProps {
  onMenuClick: () => void;
  onAuthClick: () => void;
  user: any;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onAuthClick, user }) => {
  return (
    <header className="fixed top-0 left-0 w-full bg-white/90 dark:bg-gray-900/90 p-4 z-10 flex items-center justify-between shadow-sm border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          aria-label="Open main menu"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <div className="ml-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Better stories Ai</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700">
            <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center text-[10px] font-bold text-white dark:text-black">
              {user.email?.[0].toUpperCase()}
            </div>
            <span className="text-xs font-bold hidden sm:inline text-zinc-700 dark:text-zinc-300 truncate max-w-[100px]">{user.email.split('@')[0]}</span>
          </div>
        ) : (
          <button 
            onClick={onAuthClick}
            className="text-xs font-bold uppercase tracking-widest px-4 py-2 border-2 border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
