
import React, { useRef } from 'react';
import { Character } from '../types';
import { UploadIcon, TrashIcon } from './icons';

interface CharacterSlotProps {
  character: Character;
  onChange: (id: number, updatedCharacter: Partial<Character>) => void;
  onRemove: (id: number) => void;
  isRemovable: boolean;
}

export const CharacterSlot: React.FC<CharacterSlotProps> = ({ character, onChange, onRemove, isRemovable }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(character.id, { [e.target.name]: e.target.value });
  };
  
  const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(character.id, { enabled: e.target.checked });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(character.id, { image: e.target.files[0] });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const imageUrl = character.image 
    ? URL.createObjectURL(character.image)
    : character.imageBase64 && character.mimeType
    ? `data:${character.mimeType};base64,${character.imageBase64}`
    : null;

  return (
    <div className="p-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-2">
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={character.enabled}
          onChange={handleEnabledChange}
          className="form-checkbox h-4 w-4 text-black bg-white dark:bg-black border-gray-300 dark:border-zinc-600 rounded-none focus:ring-0 focus:ring-offset-0"
        />
        <div className="flex-grow">
          <input
            type="text"
            name="name"
            value={character.name}
            onChange={handleInputChange}
            className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none placeholder-gray-400"
            placeholder="Character Name"
          />
        </div>
        <button
          onClick={handleUploadClick}
          className="flex items-center space-x-2 text-xs px-2 py-1 bg-white dark:bg-black border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-black dark:text-white uppercase tracking-wide"
        >
          {imageUrl ? (
            <img src={imageUrl} alt="preview" className="w-5 h-5 object-cover border border-gray-200 dark:border-zinc-700" />
          ) : (
            <UploadIcon className="w-3 h-3" />
          )}
          <span>{imageUrl ? 'Edit' : 'Img'}</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        {isRemovable && (
          <button
            onClick={() => onRemove(character.id)}
            className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            aria-label="Remove character"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <div>
        <textarea
          name="description"
          rows={2}
          value={character.description}
          onChange={handleInputChange}
          placeholder="Visual description (e.g. 'man with beard, blue robe')"
          className="w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-black dark:focus:border-white resize-none"
        />
      </div>
    </div>
  );
};
