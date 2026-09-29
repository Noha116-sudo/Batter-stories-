
import React from 'react';
import { XMarkIcon, SunIcon, MoonIcon, SparklesIcon, SpeakerWaveIcon, HomeIcon, UserGroupIcon, RectangleStackIcon, ClockIcon, LightBulbIcon, BookOpenIcon, PlayIcon } from './icons';

interface MainMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateHome: () => void;
  onOpenCharacterGenerator: () => void;
  onOpenScriptGenerator: () => void;
  onOpenVoiceoverGenerator: () => void;
  onOpenThumbnailGenerator: () => void;
  onOpenBrainstormer: () => void;
  onOpenProductGenerator: () => void;
  onOpenYouTubeTools: () => void;
  onOpenHistory: () => void;
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  user: any;
  onLogout: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  isOpen,
  onClose,
  onNavigateHome,
  onOpenCharacterGenerator,
  onOpenScriptGenerator,
  onOpenVoiceoverGenerator,
  onOpenThumbnailGenerator,
  onOpenBrainstormer,
  onOpenProductGenerator,
  onOpenYouTubeTools,
  onOpenHistory,
  theme,
  setTheme,
  user,
  onLogout
}) => {
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose}></div>
      <div className="fixed top-0 left-0 h-full w-full max-w-xs bg-white dark:bg-gray-900 shadow-2xl z-50 p-6 flex flex-col border-r border-gray-200 dark:border-gray-800">
        <header className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h2>
          <button onClick={onClose} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        
        <nav className="mt-6 space-y-2 flex-grow overflow-y-auto scrollbar-thin">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center text-left p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <HomeIcon className="w-5 h-5 mr-3" />
            Home
          </button>
          
          <div className="pt-4 space-y-2">
            <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Tools</h3>
            <button onClick={onOpenCharacterGenerator} className="w-full flex items-center text-left p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <UserGroupIcon className="w-5 h-5 mr-3" />
              AI Character & Scene Creator
            </button>
            <button onClick={onOpenBrainstormer} className="w-full flex items-center text-left p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <LightBulbIcon className="w-5 h-5 mr-3" />
              AI Brainstormer
            </button>
            <button onClick={onOpenScriptGenerator} className="w-full flex items-center text-left p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <SparklesIcon className="w-5 h-5 mr-3" />
              AI Script Generator
            </button>
            <button onClick={onOpenVoiceoverGenerator} className="w-full flex items-center text-left p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <SpeakerWaveIcon className="w-5 h-5 mr-3" />
              AI Voiceover Generator
            </button>
            <button onClick={onOpenThumbnailGenerator} className="w-full flex items-center text-left p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <RectangleStackIcon className="w-5 h-5 mr-3" />
              AI Thumbnail Generator
            </button>
            <button onClick={onOpenProductGenerator} className="w-full flex items-center text-left p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <BookOpenIcon className="w-5 h-5 mr-3" />
              Digital Product Generator
            </button>
             <button onClick={onOpenYouTubeTools} className="w-full flex items-center text-left p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <PlayIcon className="w-5 h-5 mr-3 text-red-500" />
              AI YouTube Tools
            </button>
          </div>

           <div className="pt-4 space-y-2">
            <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Activity</h3>
            <button onClick={onOpenHistory} className="w-full flex items-center text-left p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ClockIcon className="w-5 h-5 mr-3" />
              Activity History
            </button>
          </div>
        </nav>
        
        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
            <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3">Appearance</h3>
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>
            </div>

            {user && (
                <div>
                     <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3">Account</h3>
                     <button
                        onClick={onLogout}
                        className="w-full flex items-center text-left p-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5 mr-3" />
                        Log Out
                    </button>
                </div>
            )}
        </div>
      </div>
    </>
  );
};
