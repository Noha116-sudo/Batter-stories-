
import React from 'react';
import { GeneratedImage } from '../types';
import { ImageCard } from './ImageCard';
import { SparklesIcon, DownloadIcon, ExclamationTriangleIcon } from './icons';

interface ResultsDisplayProps {
  images: GeneratedImage[];
  isLoading: boolean;
  error: string | null;
  onDownloadAll: () => void;
  onRegenerateScene: (index: number) => void;
}

const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-zinc-500">
    <SparklesIcon className="w-16 h-16 text-black dark:text-white animate-pulse mb-4 opacity-50" />
    <h2 className="text-xl font-bold mb-2 text-black dark:text-white uppercase tracking-widest">Generating</h2>
    <p className="text-sm">Crafting your vision...</p>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-gray-300 dark:text-zinc-700">
    <SparklesIcon className="w-16 h-16 mb-4 opacity-20" />
    <h2 className="text-xl font-bold mb-2 uppercase tracking-widest">Canvas Empty</h2>
    <p className="text-sm">Configure and generate to begin.</p>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center h-full text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-4 border border-red-100 dark:border-red-900">
    <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
    <h2 className="text-lg font-bold mb-2 uppercase tracking-wide">Error</h2>
    <p className="max-w-md text-sm">{error}</p>
  </div>
);


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ images, isLoading, error, onDownloadAll, onRegenerateScene }) => {
  const hasImages = images.length > 0;

  // Sort images by scene index to ensure that even if generated out of order (by phase),
  // they appear sequentially.
  const sortedImages = [...images].sort((a, b) => a.sceneIndex - b.sceneIndex);

  const renderContent = () => {
    // Only show full-screen loading if we have NO images yet.
    if (!hasImages && isLoading) {
      return <LoadingState />;
    }
    
    // Only show full-screen error if we have NO images.
    if (!hasImages && error) {
      return <ErrorState error={error} />;
    }
    
    if (!hasImages && !isLoading) {
      return <EmptyState />;
    }
    
    // If we have images, show the grid.
    return (
        <>
            {/* Subtle Loading Indicator for Progressive Generation */}
            {isLoading && hasImages && (
                 <div className="mb-4 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-black dark:text-white text-xs uppercase tracking-wider font-bold animate-pulse">
                    <SparklesIcon className="w-4 h-4 animate-spin mr-2" />
                    Generating remaining scenes...
                 </div>
            )}
            
            {error && (
                 <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 text-xs font-bold uppercase">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                    {error}
                 </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {sortedImages.map((image) => (
                    <ImageCard 
                        key={image.filename} 
                        image={image} 
                        index={image.sceneIndex} 
                        onRegenerate={() => onRegenerateScene(image.sceneIndex)}
                    />
                ))}
            </div>
        </>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-black dark:text-white uppercase tracking-widest">Output</h2>
        {hasImages && !isLoading && (
          <button
            onClick={onDownloadAll}
            className="flex items-center bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold py-2 px-4 rounded-none transition-colors text-xs uppercase tracking-wider"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download ZIP
          </button>
        )}
      </header>
      <div className="flex-grow overflow-y-auto pr-2">
        {renderContent()}
      </div>
    </div>
  );
};
