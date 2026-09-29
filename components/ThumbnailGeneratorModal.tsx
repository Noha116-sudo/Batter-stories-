
import React, { useState, useEffect, useRef } from 'react';
import { generateThumbnailConcept, generateImage, IMAGE_MODELS, generateThumbnailOverlayText } from '../services/geminiService';
import { XMarkIcon, SparklesIcon, DownloadIcon, PhotoIcon, UploadIcon, TrashIcon, BookmarkIcon, ArrowPathIcon, ChevronDownIcon, PlusIcon, CheckIcon, ClipboardIcon, BookOpenIcon, MegaphoneIcon } from './icons';
import { ANIMATION_STYLES, AspectRatio, Preset, GeneratorType } from '../types';
import { fileToBase64 } from '../utils/helpers';

interface ThumbnailGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle: string;
  initialScript: string;
  onAddToHistory: (type: GeneratorType, summary: string, config: any) => void;
}

const addItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => { if (item && !list.includes(item)) setList([...list, item]); };
const removeItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => { setList(list.filter(i => i !== item)); };

const MultiSelectInput: React.FC<{ label: string; options: string[]; selectedItems: string[]; setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>; customValue: string; setCustomValue: React.Dispatch<React.SetStateAction<string>>; placeholder: string; }> = ({ label, options, selectedItems, setSelectedItems, customValue, setCustomValue, placeholder }) => (
    <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{label}</label>
        <div className="flex flex-wrap gap-2 mb-2">
            {selectedItems.map(item => (
                <span key={item} className="flex items-center bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                    {item}
                    <button onClick={() => removeItem(item, selectedItems, setSelectedItems)} className="ml-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><XMarkIcon className="w-3 h-3"/></button>
                </span>
            ))}
        </div>
        <div className="flex gap-2">
            <select value="" onChange={(e) => addItem(e.target.value, selectedItems, setSelectedItems)} className="w-1/2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs dark:text-white"><option value="" disabled>Select...</option>{options.filter(o => !selectedItems.includes(o)).map(o => (<option key={o} value={o}>{o}</option>))}</select>
            <div className="flex-grow flex gap-1"><input type="text" value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder={placeholder} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs dark:text-white" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(customValue, selectedItems, setSelectedItems); setCustomValue(''); } }} /><button onClick={() => { addItem(customValue, selectedItems, setSelectedItems); setCustomValue(''); }} disabled={!customValue.trim()} className="bg-gray-200 dark:bg-gray-700 p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"><PlusIcon className="w-4 h-4"/></button></div>
        </div>
    </div>
);

export const ThumbnailGeneratorModal: React.FC<ThumbnailGeneratorModalProps> = ({ isOpen, onClose, initialTitle, initialScript, onAddToHistory }) => {
  const [title, setTitle] = useState('');
  const [scriptContext, setScriptContext] = useState('');
  const [description, setDescription] = useState('');
  const [textOverlay, setTextOverlay] = useState('');
  const [optimizeCTR, setOptimizeCTR] = useState(true);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [artStyle, setArtStyle] = useState<string[]>([ANIMATION_STYLES[8]]); // Cinematic
  const [customArtStyle, setCustomArtStyle] = useState('');
  const [imageModel, setImageModel] = useState<string>(IMAGE_MODELS[0].id);
  
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [isAutoGeneratingOverlay, setIsAutoGeneratingOverlay] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageSrc, setGeneratedImageSrc] = useState<string | null>(null);
  
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('better-stories-thumbnail-presets');
    if (saved) { try { setPresets(JSON.parse(saved)); } catch(e) { console.error(e); } }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setScriptContext(initialScript || '');
      setError(null);
    }
  }, [isOpen, initialTitle, initialScript]);

  const handleAutoGenerateDescription = async () => {
    if (!title.trim()) return;
    setIsAutoGenerating(true); setError(null);
    try {
      const concept = await generateThumbnailConcept(title, scriptContext, optimizeCTR);
      setDescription(concept);
    } catch (e) { setError("Failed to generate concept."); } finally { setIsAutoGenerating(false); }
  };

  const handleAutoGenerateOverlay = async () => {
    if (!title.trim()) return;
    setIsAutoGeneratingOverlay(true); setError(null);
    try {
      const text = await generateThumbnailOverlayText(title, description);
      setTextOverlay(text);
    } catch (e) { setError("Failed to generate hook text."); } finally { setIsAutoGeneratingOverlay(false); }
  };

  const handleGenerateImage = async () => {
    if (!description.trim()) { setError("Please provide a description."); return; }
    setIsGeneratingImage(true); setError(null);
    try {
      // The visual concept strictly excludes text as per prompt rules in geminiService.
      // We only bake text overlay into the actual model prompt here if user has it.
      let finalPrompt = description;
      if (textOverlay.trim()) {
          finalPrompt = `${finalPrompt}. Clear, readable text overlay on a part of the image saying: "${textOverlay}" in a bold high-impact font.`;
      }
      
      const refImgs = referenceImage ? [{ data: await fileToBase64(referenceImage), mimeType: referenceImage.type }] : [];
      const base64 = await generateImage(finalPrompt, refImgs, artStyle.join(', '), aspectRatio, imageModel);
      setGeneratedImageSrc(`data:image/png;base64,${base64}`);
      onAddToHistory('thumbnail', title, { title, description, textOverlay, imageModel, artStyle });
    } catch (e) { setError(e instanceof Error ? e.message : "Image generation failed."); } finally { setIsGeneratingImage(false); }
  };

  const handleDownload = () => {
    if (!generatedImageSrc) return;
    const link = document.createElement('a');
    link.href = generatedImageSrc;
    link.download = `thumbnail_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const savePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: newPresetName,
      type: 'thumbnail',
      config: { artStyle, imageModel, aspectRatio, optimizeCTR }
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('better-stories-thumbnail-presets', JSON.stringify(updated));
    setNewPresetName(''); setShowPresetSave(false);
  };

  const loadPreset = (p: Preset) => {
    setArtStyle(p.config.artStyle);
    setImageModel(p.config.imageModel);
    setAspectRatio(p.config.aspectRatio);
    setOptimizeCTR(p.config.optimizeCTR);
    setIsPresetDropdownOpen(false);
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('better-stories-thumbnail-presets', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col md:flex-row overflow-hidden border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        
        {/* Left Controls Panel */}
        <div className="w-full md:w-5/12 p-6 border-r border-gray-200 dark:border-gray-800 overflow-y-auto scrollbar-thin bg-gray-50/50 dark:bg-gray-900 flex-shrink-0">
          <header className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <PhotoIcon className="w-6 h-6 mr-2 text-sky-600" /> 
                AI Thumbnail Generator
            </h2>
            <button onClick={onClose} className="md:hidden p-1 text-gray-500"><XMarkIcon className="w-6 h-6" /></button>
          </header>

          <div className="space-y-4">
             {/* Presets Bar */}
            <div className="flex items-center space-x-2 mb-4 bg-white dark:bg-black p-2 border border-gray-200 dark:border-gray-800 shadow-sm relative z-20">
                <BookmarkIcon className="w-4 h-4 text-gray-400" />
                <div className="relative flex-grow">
                    <button onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)} className="w-full text-left bg-transparent text-[10px] font-bold uppercase tracking-widest text-gray-500 flex justify-between items-center px-1">
                        <span>Load Preset...</span>
                        <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {isPresetDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-xl z-30 max-h-48 overflow-y-auto">
                            {presets.length === 0 && <div className="p-3 text-[10px] text-gray-500 italic">No presets saved.</div>}
                            {presets.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer" onClick={() => loadPreset(p)}>
                                    <span className="text-xs text-gray-700 dark:text-gray-200 flex-grow truncate">{p.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }} className="text-gray-400 hover:text-red-500 p-1"><TrashIcon className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={() => setShowPresetSave(!showPresetSave)} className="text-[10px] font-bold uppercase text-sky-600 hover:underline border-l border-gray-200 dark:border-gray-800 pl-2">Save</button>
            </div>
            
            {showPresetSave && (
                <div className="flex items-center space-x-2 mb-4 animate-in fade-in slide-in-from-top-1">
                    <input type="text" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} placeholder="Preset Name" className="flex-grow text-xs p-2 border dark:bg-gray-800 dark:border-gray-700 dark:text-white rounded" />
                    <button onClick={savePreset} className="bg-sky-600 text-white text-[10px] font-bold px-3 py-2 rounded uppercase">Save</button>
                </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Video Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Main Hook or Topic" className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm dark:text-white focus:ring-1 focus:ring-sky-500" />
            </div>

            <div className="p-3 bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900 rounded-lg">
                <label className="flex items-center space-x-3 cursor-pointer group">
                    <input type="checkbox" checked={optimizeCTR} onChange={e => setOptimizeCTR(e.target.checked)} className="form-checkbox h-5 w-5 text-sky-600 rounded border-gray-300 focus:ring-0" />
                    <div>
                        <span className="block text-xs font-bold text-sky-900 dark:text-sky-100 uppercase tracking-tight">Max CTR Logic</span>
                        <span className="block text-[10px] text-sky-700 dark:text-sky-400 uppercase opacity-75">Curiosity Gaps & Belief Contradictions</span>
                    </div>
                </label>
            </div>

            {/* Visual / Script Context Section */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Visual / Script Context</label>
              <textarea rows={2} value={scriptContext} onChange={e => setScriptContext(e.target.value)} placeholder="Paste script or visual notes..." className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs dark:text-white resize-none" />
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Visual Concept (No Text!)</label>
              <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="AI generates a visual-only description here..." className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-3 text-xs dark:text-white resize-none" />
              <button onClick={handleAutoGenerateDescription} disabled={isAutoGenerating || !title.trim()} className="absolute right-2 bottom-2 p-2 bg-sky-100 dark:bg-gray-700 text-sky-600 rounded-md hover:bg-sky-200 transition-colors shadow-sm disabled:opacity-50" title="Generate Visual Concept">
                <PhotoIcon className={`w-4 h-4 ${isAutoGenerating ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            <div className="relative p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <label className="block text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1">Dedicated Text Overlay</label>
              <div className="flex gap-2">
                <input type="text" value={textOverlay} onChange={e => setTextOverlay(e.target.value)} placeholder="High CTR Overlay Text..." className="flex-grow bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs dark:text-white" />
                <button onClick={handleAutoGenerateOverlay} disabled={isAutoGeneratingOverlay || !title.trim()} className="p-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors disabled:opacity-50" title="Generate CTR Overlay Text">
                  <MegaphoneIcon className={`w-4 h-4 ${isAutoGeneratingOverlay ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="mt-1 text-[9px] text-gray-400 uppercase tracking-tighter">AI will generate curiosity-sparking or contradictory hooks.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Model</label>
                <select value={imageModel} onChange={e => setImageModel(e.target.value)} className="w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-2 text-[10px] dark:text-white">
                    {IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Ratio</label>
                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-2 text-[10px] dark:text-white">
                  <option value="16:9">16:9</option><option value="9:16">9:16</option><option value="1:1">1:1</option><option value="4:3">4:3</option>
                </select>
              </div>
            </div>

            <MultiSelectInput label="Art Style" options={ANIMATION_STYLES} selectedItems={artStyle} setSelectedItems={setArtStyle} customValue={customArtStyle} setCustomValue={setCustomArtStyle} placeholder="Add style..." />

            <div className="flex items-center space-x-3">
                <button onClick={() => fileInputRef.current?.click()} className="flex-grow flex items-center justify-center space-x-2 text-[10px] font-bold uppercase p-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white transition-colors">
                    {referenceImage ? <img src={URL.createObjectURL(referenceImage)} className="w-4 h-4 object-cover rounded" /> : <UploadIcon className="w-4 h-4" />}
                    <span>{referenceImage ? 'Change Image' : 'Add Ref Image'}</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={e => setReferenceImage(e.target.files?.[0] || null)} className="hidden" accept="image/*" />
                {referenceImage && <button onClick={() => setReferenceImage(null)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded"><TrashIcon className="w-4 h-4"/></button>}
            </div>

            <button onClick={handleGenerateImage} disabled={isGeneratingImage || !description.trim()} className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 rounded-lg shadow-lg transition-all uppercase tracking-widest text-xs disabled:opacity-50">
              {isGeneratingImage ? <><SparklesIcon className="w-4 h-4 mr-2 animate-spin inline" /> Constructing Layout...</> : '🔥 Generate Viral Thumbnail'}
            </button>
            {error && <p className="text-[10px] text-red-500 text-center uppercase font-bold">{error}</p>}
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="w-full md:w-7/12 bg-white dark:bg-gray-950 flex flex-col overflow-hidden">
            <header className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 flex justify-between items-center">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Live Preview Output</h3>
                 <button onClick={onClose} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><XMarkIcon className="w-5 h-5"/></button>
            </header>
            <div className="flex-grow flex flex-col items-center justify-center p-8 overflow-y-auto scrollbar-thin">
                {generatedImageSrc ? (
                    <div className="space-y-6 flex flex-col items-center w-full max-w-lg">
                        <div className="relative group rounded-lg overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 transition-transform hover:scale-[1.02]">
                            <img src={generatedImageSrc} alt="Thumbnail Result" className="w-full h-auto" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={handleDownload} className="p-4 bg-white text-black rounded-full shadow-lg hover:scale-110 transition-transform"><DownloadIcon className="w-6 h-6"/></button>
                            </div>
                        </div>
                        <div className="flex space-x-4 w-full">
                            <button onClick={handleDownload} className="flex-grow flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded uppercase tracking-widest text-[10px]">
                                <DownloadIcon className="w-4 h-4" />
                                <span>Download PNG</span>
                            </button>
                            <button onClick={handleGenerateImage} className="px-4 border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                                <ArrowPathIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="relative inline-block">
                             <PhotoIcon className="w-24 h-24 text-gray-200 dark:text-gray-800" />
                             <SparklesIcon className="w-8 h-8 text-sky-200 dark:text-sky-800 absolute -top-2 -right-2 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Canvas Ready</p>
                            <p className="text-[10px] text-gray-400 uppercase italic">Configure your viral strategy on the left</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
