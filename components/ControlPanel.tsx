
import React, { useState, useRef, useMemo } from 'react';
import { Character, AspectRatio, ANIMATION_STYLES, SceneItem } from '../types';
import { CharacterSlot } from './CharacterSlot';
import { PlusIcon, TrashIcon, SparklesIcon, PhotoIcon, ClockIcon, ChevronDownIcon, XMarkIcon } from './icons';
import { parseScriptForScenes, IMAGE_MODELS } from '../services/geminiService';

interface ControlPanelProps {
  characters: Character[];
  onCharacterChange: (id: number, updatedCharacter: Partial<Character>) => void;
  onAddCharacter: () => void;
  onBulkAddCharacters: (files: File[]) => void;
  onRemoveCharacter: (id: number) => void;
  scenes: SceneItem[];
  setScenes: React.Dispatch<React.SetStateAction<SceneItem[]>>;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  animationStyle: string[];
  setAnimationStyle: React.Dispatch<React.SetStateAction<string[]>>;
  imageModel: string;
  setImageModel: (model: string) => void;
  onGenerate: (indices: number[]) => void;
  isLoading: boolean;
  autoParserScript: string;
  setAutoParserScript: (script: string) => void;
}

// Helper functions for multi-select
const addItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (item && !list.includes(item)) {
        setList([...list, item]);
    }
};

const removeItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(list.filter(i => i !== item));
};

interface MultiSelectInputProps {
    label: string;
    options: string[];
    selectedItems: string[];
    setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
    customValue: string;
    setCustomValue: React.Dispatch<React.SetStateAction<string>>;
    placeholder: string;
}

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({ 
    label, 
    options, 
    selectedItems, 
    setSelectedItems, 
    customValue, 
    setCustomValue, 
    placeholder 
}) => (
    <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</label>
        
        <div className="flex flex-wrap gap-2 mb-3">
            {selectedItems.map(item => (
                <span key={item} className="flex items-center bg-gray-100 dark:bg-zinc-800 text-black dark:text-white text-xs font-medium px-2 py-1 border border-gray-300 dark:border-zinc-700">
                    {item}
                    <button onClick={() => removeItem(item, selectedItems, setSelectedItems)} className="ml-2 text-gray-400 hover:text-black dark:hover:text-white">
                        <XMarkIcon className="w-3 h-3"/>
                    </button>
                </span>
            ))}
            {selectedItems.length === 0 && <span className="text-xs text-gray-400 italic">None selected</span>}
        </div>

        <div className="flex gap-2">
            <select 
                value="" 
                onChange={(e) => addItem(e.target.value, selectedItems, setSelectedItems)} 
                className="w-1/2 bg-white dark:bg-black border-b-2 border-gray-300 dark:border-zinc-700 px-2 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white rounded-none"
            >
                <option value="" disabled>Select...</option>
                {options.filter(o => !selectedItems.includes(o)).map(o => (
                    <option key={o} value={o}>{o}</option>
                ))}
            </select>
            
            <div className="flex-grow flex gap-1">
                <input 
                    type="text" 
                    value={customValue} 
                    onChange={(e) => setCustomValue(e.target.value)} 
                    placeholder={placeholder} 
                    className="w-full bg-white dark:bg-black border-b-2 border-gray-300 dark:border-zinc-700 px-2 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white rounded-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem(customValue, selectedItems, setSelectedItems);
                            setCustomValue('');
                        }
                    }}
                />
                <button 
                    onClick={() => {
                        addItem(customValue, selectedItems, setSelectedItems);
                        setCustomValue('');
                    }} 
                    disabled={!customValue.trim()}
                    className="bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-black dark:text-white p-2 border border-transparent disabled:opacity-50"
                >
                    <PlusIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  characters,
  onCharacterChange,
  onAddCharacter,
  onBulkAddCharacters,
  onRemoveCharacter,
  scenes,
  setScenes,
  aspectRatio,
  setAspectRatio,
  animationStyle,
  setAnimationStyle,
  imageModel,
  setImageModel,
  onGenerate,
  isLoading,
  autoParserScript,
  setAutoParserScript,
}) => {
  const [isParsing, setIsParsing] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const bulkAddInputRef = useRef<HTMLInputElement>(null);
  const [customStyle, setCustomStyle] = useState('');

  const handleSceneChange = (index: number, newDescription: string) => {
    const newScenes = [...scenes];
    newScenes[index] = { ...newScenes[index], description: newDescription };
    setScenes(newScenes);
  };

  const addScene = () => {
    if (scenes.length < 100) {
      setScenes([...scenes, { description: '', timestamp: '00:00' }]);
    }
  };

  const removeScene = (index: number) => {
    if (scenes.length > 1) {
      const newScenes = scenes.filter((_, i) => i !== index);
      setScenes(newScenes);
    }
  };

  const handleParseScript = async () => {
    if (!autoParserScript.trim()) return;
    setIsParsing(true);
    setParsingError(null);
    try {
      const parsedScenes = await parseScriptForScenes(autoParserScript);
      if (parsedScenes.length > 0) {
        setScenes(parsedScenes);
      } else {
        setParsingError("The AI couldn't find any distinct scenes. Try reformatting your script.");
      }
    } catch (error) {
      console.error("Failed to parse script:", error);
      setParsingError(error instanceof Error ? error.message : "An unknown error occurred during parsing.");
    } finally {
      setIsParsing(false);
    }
  };
  
  const handleBulkAddFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onBulkAddCharacters(Array.from(event.target.files));
    }
    event.target.value = '';
  };

  // --- Phase Calculation Logic ---
  const CHUNK_SIZE = 10;
  
  const phases = useMemo(() => {
      const numPhases = Math.ceil(scenes.length / CHUNK_SIZE);
      const phaseList = [];
      for(let i=0; i<numPhases; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, scenes.length);
          const indices = Array.from({length: end - start}, (_, k) => k + start);
          phaseList.push({
              name: `Batch ${i + 1}`,
              label: `Scenes ${start + 1} - ${end}`,
              indices: indices
          });
      }
      return phaseList;
  }, [scenes]);

  const allIndices = useMemo(() => scenes.map((_, index) => index), [scenes]);

  return (
    <div className="bg-white dark:bg-black p-4 space-y-8 flex flex-col h-full border-r border-gray-200 dark:border-zinc-800">
      
      {/* Section: Pillars of the Story */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest border-b border-gray-200 dark:border-zinc-800 pb-2">1. Characters</h2>
        <div className="space-y-3">
          {characters.map((char, index) => (
            <CharacterSlot
              key={char.id}
              character={char}
              onChange={onCharacterChange}
              onRemove={onRemoveCharacter}
              isRemovable={index > 0} 
            />
          ))}
        </div>
        <div className="mt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onAddCharacter}
                    disabled={characters.length >= 10}
                    className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wide transition-colors"
                >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add
                </button>
                <button
                    onClick={() => bulkAddInputRef.current?.click()}
                    disabled={characters.length >= 10}
                    className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wide transition-colors"
                >
                    <PhotoIcon className="w-4 h-4 mr-2" />
                    Bulk
                </button>
                <input
                    type="file"
                    ref={bulkAddInputRef}
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleBulkAddFiles}
                />
            </div>
            <p className="text-[10px] text-center text-gray-400 dark:text-zinc-600 uppercase tracking-widest">
                {characters.length} / 10 Slots Used
            </p>
        </div>

        <div className="pt-4">
           <MultiSelectInput 
                label="Art Style"
                options={ANIMATION_STYLES}
                selectedItems={animationStyle}
                setSelectedItems={setAnimationStyle}
                customValue={customStyle}
                setCustomValue={setCustomStyle}
                placeholder="Custom style..."
           />
        </div>
      </div>

      {/* Section: Image Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest border-b border-gray-200 dark:border-zinc-800 pb-2">2. Configuration</h2>
        
        <div>
            <label htmlFor="model-select" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Model</label>
            <select
              id="model-select"
              value={imageModel}
              onChange={(e) => setImageModel(e.target.value)}
              className="w-full bg-white dark:bg-black border-b-2 border-gray-300 dark:border-zinc-700 px-2 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white rounded-none"
            >
              {IMAGE_MODELS.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
        </div>

        <div className="pt-2">
            <label htmlFor="aspect-ratio-select" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Ratio</label>
            <select
              id="aspect-ratio-select"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full bg-white dark:bg-black border-b-2 border-gray-300 dark:border-zinc-700 px-2 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white rounded-none"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="4:3">4:3 (Classic)</option>
            </select>
        </div>
      </div>

      {/* Section: Scene Prompts */}
      <div className="space-y-4 flex-grow flex flex-col min-h-0">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest border-b border-gray-200 dark:border-zinc-800 pb-2">3. Scenes</h2>
        
        <div className="space-y-2">
            <textarea
                rows={3}
                value={autoParserScript}
                onChange={(e) => setAutoParserScript(e.target.value)}
                placeholder="Paste script or list of visual prompts here..."
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-3 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-black dark:focus:ring-white rounded-none"
            />
            <button
                onClick={handleParseScript}
                disabled={isParsing || !autoParserScript.trim()}
                className="w-full flex items-center justify-center text-xs font-bold bg-gray-200 hover:bg-gray-300 text-black dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white px-4 py-2 uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                {isParsing ? 'Processing...' : 'Auto-Extract Scenes'}
            </button>
            {parsingError && <p className="text-xs text-red-600 mt-1">{parsingError}</p>}
        </div>
        
        <div className="space-y-3 flex-grow overflow-y-auto pr-2 scrollbar-thin">
            {scenes.map((scene, index) => (
                <div key={index} className="flex items-start space-x-2 group">
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500 pt-3 w-6">{String(index+1).padStart(2,'0')}</span>
                    <textarea
                        rows={2}
                        value={scene.description}
                        onChange={(e) => handleSceneChange(index, e.target.value)}
                        placeholder={`Description...`}
                        className="flex-grow bg-transparent border-b border-gray-200 dark:border-zinc-800 focus:border-black dark:focus:border-white p-2 text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-zinc-700 resize-none transition-colors"
                    />
                    <button
                        onClick={() => removeScene(index)}
                        className="mt-2 text-gray-300 hover:text-red-500 dark:text-zinc-700 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        disabled={scenes.length <= 1}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
        <button
            onClick={addScene}
            disabled={scenes.length >= 100}
            className="flex items-center justify-center w-full px-4 py-3 border border-dashed border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors uppercase text-xs tracking-wider"
        >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Scene
        </button>
      </div>
      
      <div className="pt-4 sticky bottom-0 bg-white dark:bg-black border-t border-gray-200 dark:border-zinc-800 mt-auto">
        <div className="space-y-3">
            {/* Primary Action: Generate All - Always visible */}
            <button
                onClick={() => onGenerate(allIndices)}
                disabled={isLoading || isParsing || scenes.length === 0}
                className="w-full flex items-center justify-center text-sm font-bold bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black px-6 py-4 transition-colors disabled:opacity-50 disabled:cursor-wait uppercase tracking-widest"
            >
                {isLoading ? (
                    <>
                    <SparklesIcon className="w-5 h-5 mr-3 animate-spin" />
                    Processing...
                    </>
                ) : (
                    `Generate All (${scenes.length})`
                )}
            </button>

            {/* Secondary Action: Batches (for > 10 scenes) */}
            {phases.length > 1 && !isLoading && (
                <details className="group">
                    <summary className="flex justify-between items-center cursor-pointer text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white p-2 border border-gray-200 dark:border-zinc-800 select-none">
                        <span>Batch Generation</span>
                        <ChevronDownIcon className="w-3 h-3 group-open:rotate-180 transition-transform"/>
                    </summary>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-1">
                        {phases.map((phase) => (
                             <button
                                key={phase.name}
                                onClick={() => onGenerate(phase.indices)}
                                disabled={isLoading || isParsing}
                                className="flex flex-col items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 text-black dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-white px-3 py-2 border border-gray-200 dark:border-zinc-700 transition-all disabled:opacity-50"
                             >
                                <span className="font-bold">{phase.name}</span>
                                <span className="opacity-75 text-[10px]">{phase.label}</span>
                             </button>
                        ))}
                    </div>
                </details>
            )}
        </div>
      </div>
    </div>
  );
};
