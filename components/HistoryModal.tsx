
import React from 'react';
import { XMarkIcon, ClockIcon, ArrowPathIcon, TrashIcon } from './icons';
import { HistoryItem } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onClearHistory, onRemoveItem }) => {
  if (!isOpen) return null;

  // Sort history by timestamp descending (newest first)
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <ClockIcon className="w-6 h-6 mr-2 text-sky-600" />
            Activity History
          </h2>
          <div className="flex items-center space-x-2">
              {history.length > 0 && (
                  <button 
                    onClick={onClearHistory}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center mr-4"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Clear All
                  </button>
              )}
              <button onClick={onClose} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
          </div>
        </header>
        
        <div className="p-6 overflow-y-auto flex-grow scrollbar-thin">
          {sortedHistory.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10">
              <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No history yet. Start creating stories!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedHistory.map((item) => (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-950/50 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow group relative">
                  <div className="flex justify-between items-start">
                    <div className="pr-8">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide
                          ${item.type === 'script' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 
                            item.type === 'voiceover' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' :
                            item.type === 'thumbnail' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                            item.type === 'image_batch' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                          {item.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(item.timestamp)}</span>
                      </div>
                      <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">{item.summary}</h3>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                         {item.type === 'script' && `Tone: ${item.config.tone}, Scenes: ${item.config.sceneCount}`}
                         {item.type === 'voiceover' && `Voice: ${item.config.voiceId}`}
                         {item.type === 'thumbnail' && `Style: ${item.config.artStyle}, Model: ${item.config.imageModel}`}
                         {item.type === 'image_batch' && `Scenes: ${item.config.scenes?.length || 'Multiple'}, Style: ${item.config.animationStyle}`}
                      </div>
                    </div>
                    
                    <button 
                        onClick={() => onRemoveItem(item.id)}
                        className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-50 dark:hover:bg-red-900/10"
                        title="Remove from history"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
