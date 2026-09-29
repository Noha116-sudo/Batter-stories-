
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { DownloadIcon, EyeIcon, XMarkIcon, ArrowPathIcon } from './icons';

interface ImageCardProps {
  image: GeneratedImage;
  index: number;
  onRegenerate: () => void;
}

const FullscreenModal: React.FC<{ src: string, alt: string, onClose: () => void }> = ({ src, alt, onClose }) => (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-50">
            <XMarkIcon className="w-8 h-8"/>
        </button>
        <img src={src} alt={alt} className="max-h-full max-w-full shadow-2xl border-4 border-white" onClick={(e) => e.stopPropagation()}/>
    </div>
);

export const ImageCard: React.FC<ImageCardProps> = ({ image, index, onRegenerate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = image.src;
        link.download = image.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="group relative bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors duration-300">
                <div className="aspect-video w-full overflow-hidden bg-gray-200 dark:bg-zinc-800 relative">
                     <img src={image.src} alt={image.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                     {/* Hover Overlay */}
                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                         <button 
                            onClick={() => setIsModalOpen(true)}
                            className="p-3 bg-white text-black hover:bg-gray-200 rounded-none transition-colors"
                            aria-label="View full scene"
                            title="View"
                         >
                             <EyeIcon className="w-5 h-5" />
                         </button>
                         <button 
                            onClick={onRegenerate}
                            className="p-3 bg-white text-black hover:bg-gray-200 rounded-none transition-colors"
                            aria-label="Regenerate scene"
                            title="Regenerate"
                         >
                             <ArrowPathIcon className="w-5 h-5" />
                         </button>
                         <button 
                            onClick={handleDownload}
                            className="p-3 bg-white text-black hover:bg-gray-200 rounded-none transition-colors"
                            aria-label="Download single scene"
                            title="Download"
                         >
                            <DownloadIcon className="w-5 h-5" />
                         </button>
                     </div>
                </div>
                
                <div className="p-3 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-black">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Scene {index + 1}</span>
                    </div>
                    <p className="text-xs text-gray-800 dark:text-gray-300 line-clamp-2 font-medium">{image.prompt}</p>
                </div>
            </div>
            {isModalOpen && <FullscreenModal src={image.src} alt={image.prompt} onClose={() => setIsModalOpen(false)} />}
        </>
    );
};
