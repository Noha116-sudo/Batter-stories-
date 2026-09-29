
import React, { useState, useEffect } from 'react';
import { generateScript } from '../services/geminiService';
import { XMarkIcon, SparklesIcon, PlusIcon, ClipboardIcon, CheckIcon, SpeakerWaveIcon, PhotoStackIcon, BookmarkIcon, ChevronDownIcon, TrashIcon, MegaphoneIcon, BookOpenIcon, PhotoIcon } from './icons';
import { ANIMATION_STYLES, Preset, GeneratorType } from '../types';

interface ScriptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (script: string) => void;
  onSendToVoiceover: (script: string) => void;
  onSendToThumbnail: (title: string, script: string) => void;
  onAddToHistory: (type: GeneratorType, summary: string, config: any) => void;
  initialTitle?: string;
  initialDescription?: string;
  initialDuration?: string;
  initialCtaIntro?: string[];
  initialCtaOutro?: string[];
  initialCtaShortIntro?: string[];
  initialCtaShortOutro?: string[];
  onSendToProduct?: (title: string, description: string) => void;
}

type ScriptType = 'long' | 'short' | 'both';

const TONES = ["Inspirational", "Educational", "Humorous", "Dramatic", "Somber", "Hopeful", "Encouraging", "Authoritative", "Empathetic", "Urgent", "Witty", "Conversational", "Professional", "Gentle", "Passionate", "Reflective", "Bold", "Mysterious", "Calm", "Energetic", "Sarcastic", "Nostalgic", "Warm", "Direct", "Storytelling"];
const AUDIENCES = ["Children", "Teenagers", "Young Adults", "Adults", "Families", "Seekers", "New Believers", "Mature Believers", "Students", "Professionals", "Parents", "Singles", "Married Couples", "Seniors", "Leaders/Pastors", "Creatives"];
const DEFAULT_NICHES = ["Apologetics", "Bible Study", "Biblical Storytelling", "Book Summaries & Reviews", "Business & Entrepreneurship", "Christian History", "Christian Living", "Comedy Skits", "Devotionals", "DIY & Crafts", "Family & Parenting", "Food & Cooking", "Gaming", "Health & Fitness", "History", "Missions & Outreach", "Movie Reviews & Film Analysis", "Motivation & Self-Help", "Personal Finance", "Science & Education", "Technology & Gadgets", "Testimonies", "Travel & Vlogging", "True Crime", "Worship & Music", "Youth Ministry", "Christian Counseling/Advice", "Christ Focused Self Improvement", "Step by Step Guide", "Mental Health & Faith", "Marriage & Relationships", "Single Living", "Men's Ministry", "Women's Ministry", "Prayer & Intercession", "Prophecy & End Times", "Christian Meditation"];

const CTA_PRESETS = {
    intro: [
        "Subscribe for more daily inspiration!",
        "Save this video for later.",
        "Share this with a friend who needs it.",
        "Comment 'Yes' if you agree.",
        "Check the link in bio for the full guide.",
        "Hit that like button to support the channel.",
        "You won't believe what happens next."
    ],
    outro: [
        "Don't forget to subscribe!",
        "Click the link in bio to join us.",
        "Thanks for watching, God bless.",
        "Follow for more content like this.",
        "Join our community today!",
        "Watch the next video for more.",
        "Let me know your thoughts in the comments."
    ]
};

const addItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => { if (item && !list.includes(item)) setList([...list, item]); };
const removeItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => { setList(list.filter(i => i !== item)); };

// Multi-select for CTAs
const MultiCtaInput: React.FC<{ label: string; selectedItems: string[]; setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>; presets: string[]; placeholder: string; }> = ({ label, selectedItems, setSelectedItems, presets, placeholder }) => {
    const [customVal, setCustomVal] = useState('');
    return (
        <div className="mb-4">
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{label}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedItems.map(item => (
                    <span key={item} className="flex items-center bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[9px] font-bold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                        {item}
                        <button onClick={() => removeItem(item, selectedItems, setSelectedItems)} className="ml-1 text-gray-400 hover:text-red-500"><XMarkIcon className="w-2.5 h-2.5"/></button>
                    </span>
                ))}
            </div>
            <div className="flex gap-1.5">
                <div className="relative w-1/3">
                    <select value="" onChange={(e) => addItem(e.target.value, selectedItems, setSelectedItems)} className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-[10px] dark:text-white outline-none">
                        <option value="" disabled>Presets...</option>
                        {presets.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="flex-grow flex gap-1">
                    <input type="text" value={customVal} onChange={e => setCustomVal(e.target.value)} placeholder={placeholder} className="flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-[10px] dark:text-white outline-none" onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customVal.trim()){ addItem(customVal, selectedItems, setSelectedItems); setCustomVal(''); } } }} />
                    <button onClick={() => { if(customVal.trim()){ addItem(customVal, selectedItems, setSelectedItems); setCustomVal(''); } }} className="p-1 bg-gray-100 dark:bg-gray-700 rounded border dark:border-gray-600"><PlusIcon className="w-3 h-3 text-gray-500"/></button>
                </div>
            </div>
        </div>
    );
};

// Standardized MultiSelect Component
const MultiSelectInput: React.FC<{ label: string; options: string[]; selectedItems: string[]; setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>; customValue: string; setCustomValue: React.Dispatch<React.SetStateAction<string>>; placeholder: string; }> = ({ label, options, selectedItems, setSelectedItems, customValue, setCustomValue, placeholder }) => (
    <div className="mb-4">
        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{label}</label>
        
        {/* Selected Tags */}
        <div className="flex flex-wrap gap-2 mb-2">
            {selectedItems.map(item => (
                <span key={item} className="flex items-center bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[10px] font-bold px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
                    {item}
                    <button onClick={() => removeItem(item, selectedItems, setSelectedItems)} className="ml-1.5 text-gray-400 hover:text-red-500 transition-colors"><XMarkIcon className="w-3 h-3"/></button>
                </span>
            ))}
        </div>

        {/* Input Row: Dropdown + Custom Input */}
        <div className="flex gap-2">
            <div className="relative w-1/2">
                <select 
                    value="" 
                    onChange={(e) => addItem(e.target.value, selectedItems, setSelectedItems)} 
                    className="w-full appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                    <option value="" disabled>Select Option...</option>
                    {options.filter(o => !selectedItems.includes(o)).map(o => (
                        <option key={o} value={o}>{o}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <ChevronDownIcon className="w-3 h-3" />
                </div>
            </div>
            
            <div className="flex-grow flex gap-1">
                <input 
                    type="text" 
                    value={customValue} 
                    onChange={(e) => setCustomValue(e.target.value)} 
                    placeholder={placeholder} 
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500" 
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(customValue, selectedItems, setSelectedItems); setCustomValue(''); } }} 
                />
                <button 
                    onClick={() => { addItem(customValue, selectedItems, setSelectedItems); setCustomValue(''); }} 
                    disabled={!customValue.trim()} 
                    className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 p-2 rounded-md border border-gray-300 dark:border-gray-700 disabled:opacity-50 transition-colors"
                >
                    <PlusIcon className="w-4 h-4"/>
                </button>
            </div>
        </div>
    </div>
);

export const ScriptGeneratorModal: React.FC<ScriptGeneratorModalProps> = ({ 
    isOpen, onClose, onImport, onSendToVoiceover, onSendToThumbnail, onAddToHistory, 
    initialTitle = '', initialDescription = '', initialDuration = '10', 
    initialCtaIntro = [], initialCtaOutro = [], initialCtaShortIntro = [], initialCtaShortOutro = [],
    onSendToProduct 
}) => {
  const [scriptType, setScriptType] = useState<ScriptType>('long');
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [duration, setDuration] = useState(initialDuration);
  const [highRetention, setHighRetention] = useState(true);
  const [excludeIntro, setExcludeIntro] = useState(false);
  const [excludeOutro, setExcludeOutro] = useState(false);
  
  // CTA State (Now Arrays)
  const [ctaIntro, setCtaIntro] = useState<string[]>(initialCtaIntro);
  const [ctaOutro, setCtaOutro] = useState<string[]>(initialCtaOutro);
  const [ctaShortIntro, setCtaShortIntro] = useState<string[]>(initialCtaShortIntro);
  const [ctaShortOutro, setCtaShortOutro] = useState<string[]>(initialCtaShortOutro);

  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [customNiche, setCustomNiche] = useState('');
  const [selectedTones, setSelectedTones] = useState<string[]>([TONES[0]]);
  const [customTone, setCustomTone] = useState('');
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([AUDIENCES[3]]);
  const [customAudience, setCustomAudience] = useState('');
  const [selectedArtStyles, setSelectedArtStyles] = useState<string[]>([ANIMATION_STYLES[0]]);
  const [customArtStyle, setCustomArtStyle] = useState('');
  const [sceneCount, setSceneCount] = useState(10);
  
  const [generatedScriptRaw, setGeneratedScriptRaw] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStates, setCopyStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
      if (isOpen) {
          if (initialTitle) setTitle(initialTitle);
          if (initialDescription) setDescription(initialDescription);
          if (initialDuration) setDuration(initialDuration);
          if (initialCtaIntro.length) setCtaIntro(initialCtaIntro);
          if (initialCtaOutro.length) setCtaOutro(initialCtaOutro);
          if (initialCtaShortIntro.length) setCtaShortIntro(initialCtaShortIntro);
          if (initialCtaShortOutro.length) setCtaShortOutro(initialCtaShortOutro);
      }
  }, [isOpen, initialTitle, initialDescription, initialDuration, initialCtaIntro, initialCtaOutro, initialCtaShortIntro, initialCtaShortOutro]);

  const handleGenerate = async () => {
    if (!title || selectedNiches.length === 0) { setError("Title and niche required."); return; }
    setIsLoading(true); setError(null); setGeneratedScriptRaw('');
    try {
      const result = await generateScript({ 
          scriptType, title, 
          niche: selectedNiches.join(', '), 
          tone: selectedTones.join(', '), 
          audience: selectedAudiences.join(', '), 
          artStyle: selectedArtStyles.join(', '), 
          sceneCount, description, duration, 
          highRetention, excludeIntro, excludeOutro,
          ctaIntro, ctaOutro, ctaShortIntro, ctaShortOutro
      });
      setGeneratedScriptRaw(result);
      onAddToHistory('script', title, { scriptType, highRetention, excludeIntro, excludeOutro });
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); } finally { setIsLoading(false); }
  };

  const parseGeneratedOutput = (text: string) => {
    const visualLines = text.split('\n').filter(line => line.includes('[VISUAL]')).join('\n');
    const voiceoverLines = text.split('\n').filter(line => line.includes('[VOICEOVER]')).join('\n');
    
    return {
        visuals: visualLines,
        voiceover: voiceoverLines || text 
    };
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopyStates(prev => ({ ...prev, [key]: false })), 2000);
  };

  const { visuals, voiceover } = parseGeneratedOutput(generatedScriptRaw);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold dark:text-white flex items-center"><SparklesIcon className="w-6 h-6 mr-2 text-sky-500" /> AI Script Generator</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full"><XMarkIcon className="w-6 h-6" /></button>
        </header>

        <div className="p-6 overflow-hidden flex-grow flex flex-col md:flex-row gap-6">
            {/* Left Column: Inputs */}
            <div className="w-full md:w-1/3 space-y-4 overflow-y-auto scrollbar-thin p-1">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-1 mb-2 shadow-inner">
                    <button onClick={() => setScriptType('long')} className={`flex-grow py-1.5 text-[10px] font-bold uppercase rounded transition-all ${scriptType === 'long' ? 'bg-white dark:bg-gray-700 text-sky-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Long</button>
                    <button onClick={() => setScriptType('short')} className={`flex-grow py-1.5 text-[10px] font-bold uppercase rounded transition-all ${scriptType === 'short' ? 'bg-white dark:bg-gray-700 text-sky-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Short</button>
                    <button onClick={() => setScriptType('both')} className={`flex-grow py-1.5 text-[10px] font-bold uppercase rounded transition-all ${scriptType === 'both' ? 'bg-white dark:bg-gray-700 text-sky-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Both</button>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Video Title" className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 text-xs dark:text-white focus:ring-1 focus:ring-sky-500" />
                </div>
                
                <div className="grid grid-cols-1 gap-2 p-3 bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900 rounded-lg">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                        <input type="checkbox" checked={highRetention} onChange={e => setHighRetention(e.target.checked)} className="form-checkbox text-sky-600 rounded focus:ring-0" />
                        <span className="text-[10px] font-bold text-sky-900 dark:text-sky-100 uppercase group-hover:text-sky-600">Retention Mode</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                        <input type="checkbox" checked={excludeIntro} onChange={e => setExcludeIntro(e.target.checked)} className="form-checkbox text-sky-600 rounded focus:ring-0" />
                        <span className="text-[10px] font-bold text-sky-900 dark:text-sky-100 uppercase group-hover:text-sky-600">Skip Intro</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                        <input type="checkbox" checked={excludeOutro} onChange={e => setExcludeOutro(e.target.checked)} className="form-checkbox text-sky-600 rounded focus:ring-0" />
                        <span className="text-[10px] font-bold text-sky-900 dark:text-sky-100 uppercase group-hover:text-sky-600">Skip Outro</span>
                    </label>
                </div>

                {/* Call To Actions Section */}
                <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-[10px] font-bold uppercase text-gray-500 tracking-widest border-b dark:border-gray-700 pb-1 mb-2 flex items-center"><MegaphoneIcon className="w-3 h-3 mr-1.5"/> Multiple CTAs</h3>
                    
                    {(scriptType === 'long' || scriptType === 'both') && (
                        <div className="space-y-1">
                            <label className="block text-[9px] font-bold uppercase text-sky-600">Long Form</label>
                            <MultiCtaInput label="Intro CTAs" selectedItems={ctaIntro} setSelectedItems={setCtaIntro} presets={CTA_PRESETS.intro} placeholder="Add intro CTA..." />
                            <MultiCtaInput label="Outro CTAs" selectedItems={ctaOutro} setSelectedItems={setCtaOutro} presets={CTA_PRESETS.outro} placeholder="Add outro CTA..." />
                        </div>
                    )}
                    
                    {(scriptType === 'short' || scriptType === 'both') && (
                        <div className="space-y-1 pt-1 border-t dark:border-gray-700">
                             <label className="block text-[9px] font-bold uppercase text-teal-600">Short Form</label>
                            <MultiCtaInput label="Intro Hook CTAs" selectedItems={ctaShortIntro} setSelectedItems={setCtaShortIntro} presets={CTA_PRESETS.intro} placeholder="Add short hook..." />
                            <MultiCtaInput label="Ending CTAs" selectedItems={ctaShortOutro} setSelectedItems={setCtaShortOutro} presets={CTA_PRESETS.outro} placeholder="Add short ending..." />
                        </div>
                    )}
                </div>

                <MultiSelectInput label="Target Niches" options={DEFAULT_NICHES} selectedItems={selectedNiches} setSelectedItems={setSelectedNiches} customValue={customNiche} setCustomValue={setCustomNiche} placeholder="Add niche..." />
                <MultiSelectInput label="Target Audience" options={AUDIENCES} selectedItems={selectedAudiences} setSelectedItems={setSelectedAudiences} customValue={customAudience} setCustomValue={setCustomAudience} placeholder="Add audience..." />
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Duration</label>
                        <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-2 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Scenes</label>
                        <input type="number" value={sceneCount} onChange={e => setSceneCount(parseInt(e.target.value))} className="w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-2 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
                    </div>
                </div>

                <MultiSelectInput label="Script Tone" options={TONES} selectedItems={selectedTones} setSelectedItems={setSelectedTones} customValue={customTone} setCustomValue={setCustomTone} placeholder="Add tone..." />
                <MultiSelectInput label="Visual Style" options={ANIMATION_STYLES} selectedItems={selectedArtStyles} setSelectedItems={setSelectedArtStyles} customValue={customArtStyle} setCustomValue={setCustomArtStyle} placeholder="Add style..." />
                
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Context / Storyline</label>
                    <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-2 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
                </div>

                <button onClick={handleGenerate} disabled={isLoading} className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-lg uppercase tracking-widest text-xs disabled:opacity-50 transition-all">
                    {isLoading ? 'Writing Optimized Script...' : '📝 Generate Script'}
                </button>
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            </div>

            {/* Right Column: Output */}
            <div className="w-full md:w-2/3 flex flex-col bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <SparklesIcon className="w-16 h-16 mb-4 animate-spin text-sky-500" />
                        <p className="animate-pulse font-bold uppercase text-[10px] tracking-widest">Masterminding Content...</p>
                    </div>
                ) : !generatedScriptRaw ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center opacity-40">
                        <MegaphoneIcon className="w-16 h-16 mb-4" />
                        <p className="text-xs uppercase font-bold tracking-widest">Optimized Title, Description, and Script will appear here.</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-8 overflow-y-auto scrollbar-thin h-full">
                        <div className="space-y-2 group">
                            <div className="flex justify-between items-center border-b dark:border-gray-800 pb-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-sky-500">Viral Title & Context</label>
                                <div className="flex space-x-3">
                                    <button onClick={() => onSendToThumbnail(title, generatedScriptRaw)} className="text-[9px] font-bold text-orange-500 hover:underline uppercase tracking-tighter">TO THUMBNAIL</button>
                                    {onSendToProduct && (
                                        <button onClick={() => onSendToProduct(title, description)} className="text-[9px] font-bold text-indigo-500 hover:underline uppercase tracking-tighter">TO PRODUCT</button>
                                    )}
                                    <button onClick={() => copyToClipboard(title, 'title')} className="text-gray-400 hover:text-sky-600 transition-colors">
                                        {copyStates.title ? <CheckIcon className="w-4 h-4 text-green-500"/> : <ClipboardIcon className="w-4 h-4"/>}
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded text-sm font-bold dark:text-white shadow-inner">
                                {title}
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <div className="flex justify-between items-center border-b dark:border-gray-800 pb-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Visual Storyboard Prompts</label>
                                <div className="flex space-x-3">
                                    <button onClick={() => onImport(visuals)} className="text-[9px] font-bold text-sky-600 hover:underline uppercase tracking-tighter">IMPORT TO CREATOR</button>
                                    <button onClick={() => copyToClipboard(visuals, 'visuals')} className="text-gray-400 hover:text-sky-600">
                                        {copyStates.visuals ? <CheckIcon className="w-4 h-4 text-green-500"/> : <ClipboardIcon className="w-4 h-4"/>}
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded font-mono text-[11px] leading-relaxed dark:text-gray-400 max-h-48 overflow-y-auto scrollbar-thin whitespace-pre-wrap shadow-inner border dark:border-gray-800">
                                {visuals || "No specific visuals tagged. Use voiceover for context."}
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <div className="flex justify-between items-center border-b dark:border-gray-800 pb-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-sky-500">Voiceover / Narrative Script</label>
                                <div className="flex space-x-3">
                                    <button onClick={() => onSendToVoiceover(voiceover)} className="text-[9px] font-bold text-teal-600 hover:underline uppercase tracking-tighter">TO VOICEOVER</button>
                                    <button onClick={() => copyToClipboard(voiceover, 'script')} className="text-gray-400 hover:text-sky-600">
                                        {copyStates.script ? <CheckIcon className="w-4 h-4 text-green-500"/> : <ClipboardIcon className="w-4 h-4"/>}
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded text-sm leading-relaxed dark:text-gray-200 min-h-[250px] whitespace-pre-wrap font-serif shadow-inner">
                                {voiceover}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
