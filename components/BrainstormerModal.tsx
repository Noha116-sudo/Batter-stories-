
import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon, PlusIcon, LightBulbIcon, ArrowPathIcon, CheckIcon, BookOpenIcon, MegaphoneIcon, ChevronDownIcon } from './icons';
import { brainstormVideoIdeas, VideoIdea } from '../services/geminiService';
import { ANIMATION_STYLES, AspectRatio } from '../types';

interface BrainstormerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToScriptGenerator: (idea: VideoIdea, duration: string, ctas: any) => void;
  onSendToProductGenerator?: (idea: VideoIdea) => void;
}

const DEFAULT_NICHES = ["Apologetics", "Bible Study", "Biblical Storytelling", "Book Summaries & Reviews", "Business & Entrepreneurship", "Christian History", "Christian Living", "Comedy Skits", "Devotionals", "DIY & Crafts", "Family & Parenting", "Food & Cooking", "Gaming", "Health & Fitness", "History", "Missions & Outreach", "Movie Reviews & Film Analysis", "Motivation & Self-Help", "Personal Finance", "Science & Education", "Technology & Gadgets", "Testimonies", "Travel & Vlogging", "True Crime", "Worship & Music", "Youth Ministry", "Christian Counseling/Advice", "Christ Focused Self Improvement", "Step by Step Guide", "Mental Health & Faith", "Marriage & Relationships", "Single Living", "Men's Ministry", "Women's Ministry", "Prayer & Intercession", "Prophecy & End Times", "Christian Meditation"];
const TONES = ["Inspirational", "Educational", "Humorous", "Dramatic", "Somber", "Hopeful", "Encouraging", "Authoritative", "Empathetic", "Urgent", "Witty", "Conversational", "Professional", "Gentle", "Passionate", "Reflective", "Bold", "Mysterious", "Calm", "Energetic", "Sarcastic", "Nostalgic", "Warm", "Direct", "Storytelling"];
const AUDIENCES = ["Children", "Teenagers", "Young Adults", "Adults", "Families", "Seekers", "New Believers", "Mature Believers", "Students", "Professionals", "Parents", "Singles", "Married Couples", "Seniors", "Leaders/Pastors", "Creatives"];

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

interface MultiSelectInputProps {
    label: string;
    options: string[];
    selectedItems: string[];
    setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
    customValue: string;
    setCustomValue: React.Dispatch<React.SetStateAction<string>>;
    placeholder: string;
}

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({ label, options, selectedItems, setSelectedItems, customValue, setCustomValue, placeholder }) => (
    <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{label}</label>
        <div className="flex flex-wrap gap-2 mb-2">
            {selectedItems.map(item => (
                <span key={item} className="flex items-center bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 text-[10px] font-bold px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-800 shadow-sm">
                    {item}
                    <button onClick={() => removeItem(item, selectedItems, setSelectedItems)} className="ml-1.5 text-sky-500 dark:text-sky-400 hover:text-sky-900 dark:hover:text-white"><XMarkIcon className="w-3 h-3"/></button>
                </span>
            ))}
            {selectedItems.length === 0 && <span className="text-[10px] text-gray-400 italic">None selected</span>}
        </div>
        <div className="flex gap-2">
            <select value="" onChange={(e) => addItem(e.target.value, selectedItems, setSelectedItems)} className="w-1/2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs dark:text-white outline-none focus:ring-1 focus:ring-sky-500"><option value="" disabled>Select...</option>{options.filter(o => !selectedItems.includes(o)).map(o => (<option key={o} value={o}>{o}</option>))}</select>
            <div className="flex-grow flex gap-1"><input type="text" value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder={placeholder} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs dark:text-white outline-none focus:ring-1 focus:ring-sky-500" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(customValue, selectedItems, setSelectedItems); setCustomValue(''); } }} /><button onClick={() => { addItem(customValue, selectedItems, setSelectedItems); setCustomValue(''); }} disabled={!customValue.trim()} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"><PlusIcon className="w-4 h-4"/></button></div>
        </div>
    </div>
);

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

export const BrainstormerModal: React.FC<BrainstormerModalProps> = ({ isOpen, onClose, onSendToScriptGenerator, onSendToProductGenerator }) => {
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedTones, setSelectedTones] = useState<string[]>([TONES[0]]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([AUDIENCES[3]]);
  const [selectedArtStyles, setSelectedArtStyles] = useState<string[]>([ANIMATION_STYLES[0]]);
  const [customNiche, setCustomNiche] = useState('');
  const [customTone, setCustomTone] = useState('');
  const [customAudience, setCustomAudience] = useState('');
  const [customArtStyle, setCustomArtStyle] = useState('');
  const [duration, setDuration] = useState('5');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [customDescription, setCustomDescription] = useState('');
  
  // Strategy Toggles
  const [highRetention, setHighRetention] = useState(true);
  const [excludeIntro, setExcludeIntro] = useState(false);
  const [excludeOutro, setExcludeOutro] = useState(false);

  // CTA State (Arrays)
  const [ctaIntro, setCtaIntro] = useState<string[]>([]);
  const [ctaOutro, setCtaOutro] = useState<string[]>([]);
  const [ctaShortIntro, setCtaShortIntro] = useState<string[]>([]);
  const [ctaShortOutro, setCtaShortOutro] = useState<string[]>([]);

  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentIdeaIndex, setSentIdeaIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (selectedNiches.length === 0) { setError("Please select at least one niche."); return; }
    setIsLoading(true); setError(null); setIdeas([]);
    try {
        const generatedIdeas = await brainstormVideoIdeas(
            selectedNiches.join(', '), selectedTones.join(', '), selectedAudiences.join(', '),
            duration, aspectRatio, selectedArtStyles.join(', '), customDescription,
            highRetention, excludeIntro, excludeOutro
        );
        setIdeas(generatedIdeas);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to generate ideas."); } finally { setIsLoading(false); }
  };
  
  const handleSend = (idea: VideoIdea, index: number) => {
      onSendToScriptGenerator(idea, duration, {
          intro: ctaIntro,
          outro: ctaOutro,
          shortIntro: ctaShortIntro,
          shortOutro: ctaShortOutro
      });
      setSentIdeaIndex(index);
      setTimeout(() => setSentIdeaIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        <div className="w-full md:w-5/12 p-6 border-r border-gray-200 dark:border-gray-800 overflow-y-auto scrollbar-thin bg-gray-50/50 dark:bg-gray-900 max-h-[40vh] md:max-h-full flex-shrink-0">
            <header className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center"><LightBulbIcon className="w-6 h-6 mr-2 text-yellow-500" /> AI Brainstormer</h2>
                <button onClick={onClose} className="md:hidden p-1 text-gray-500"><XMarkIcon className="w-6 h-6" /></button>
            </header>
            <div className="space-y-4">
                {/* Advanced Strategy Toggles */}
                <div className="grid grid-cols-1 gap-2 p-3 bg-sky-50 dark:bg-sky-900/10 rounded-lg border border-sky-100 dark:border-sky-900 mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                        <input type="checkbox" checked={highRetention} onChange={e => setHighRetention(e.target.checked)} className="form-checkbox text-sky-600 rounded focus:ring-0" />
                        <span className="text-[10px] font-bold text-sky-900 dark:text-sky-100 uppercase group-hover:text-sky-600">High Retention Ideas</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                        <input type="checkbox" checked={excludeIntro} onChange={e => setExcludeIntro(e.target.checked)} className="form-checkbox text-sky-600 rounded focus:ring-0" />
                        <span className="text-[10px] font-bold text-sky-900 dark:text-sky-100 uppercase group-hover:text-sky-600">Skip Intro Hooks</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                        <input type="checkbox" checked={excludeOutro} onChange={e => setExcludeOutro(e.target.checked)} className="form-checkbox text-sky-600 rounded focus:ring-0" />
                        <span className="text-[10px] font-bold text-sky-900 dark:text-sky-100 uppercase group-hover:text-sky-600">Skip Outro Ending</span>
                    </label>
                </div>

                {/* Dynamic CTAs Section */}
                <div className="space-y-3 p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm">
                    <h3 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest border-b dark:border-gray-700 pb-1 mb-2 flex items-center"><MegaphoneIcon className="w-3 h-3 mr-1.5"/> Multiple CTAs</h3>
                    <div className="space-y-1">
                        <label className="block text-[9px] font-bold uppercase text-sky-600">Long Form Script</label>
                        <MultiCtaInput label="Intro CTAs" selectedItems={ctaIntro} setSelectedItems={setCtaIntro} presets={CTA_PRESETS.intro} placeholder="Add intro CTA..." />
                        <MultiCtaInput label="Outro CTAs" selectedItems={ctaOutro} setSelectedItems={setCtaOutro} presets={CTA_PRESETS.outro} placeholder="Add outro CTA..." />
                    </div>
                    <div className="space-y-1 pt-2 border-t dark:border-gray-700">
                        <label className="block text-[9px] font-bold uppercase text-teal-600">Short Form Script</label>
                        <MultiCtaInput label="Intro Hooks" selectedItems={ctaShortIntro} setSelectedItems={setCtaShortIntro} presets={CTA_PRESETS.intro} placeholder="Add hook..." />
                        <MultiCtaInput label="Ending CTAs" selectedItems={ctaShortOutro} setSelectedItems={setCtaShortOutro} presets={CTA_PRESETS.outro} placeholder="Add ending..." />
                    </div>
                </div>

                <MultiSelectInput label="Niche(s)" options={DEFAULT_NICHES} selectedItems={selectedNiches} setSelectedItems={setSelectedNiches} customValue={customNiche} setCustomValue={setCustomNiche} placeholder="Add custom niche..." />
                <MultiSelectInput label="Tone" options={TONES} selectedItems={selectedTones} setSelectedItems={setSelectedTones} customValue={customTone} setCustomValue={setCustomTone} placeholder="Add custom tone..." />
                <MultiSelectInput label="Target Audience" options={AUDIENCES} selectedItems={selectedAudiences} setSelectedItems={setSelectedAudiences} customValue={customAudience} setCustomValue={setCustomAudience} placeholder="Add custom audience..." />
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Duration (Min)</label>
                        <input type="number" min="1" max="60" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs dark:text-white outline-none focus:ring-1 focus:ring-sky-500" />
                    </div>
                    <div>
                         <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Ratio</label>
                        <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs dark:text-white outline-none focus:ring-1 focus:ring-sky-500">
                             <option value="16:9">16:9</option><option value="9:16">9:16</option><option value="1:1">1:1</option>
                        </select>
                    </div>
                </div>
                
                <MultiSelectInput label="Art Style(s)" options={ANIMATION_STYLES} selectedItems={selectedArtStyles} setSelectedItems={setSelectedArtStyles} customValue={customArtStyle} setCustomValue={setCustomArtStyle} placeholder="Add custom style..." />
                <div className="mb-4">
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Extra Context</label>
                    <textarea rows={3} value={customDescription} onChange={e => setCustomDescription(e.target.value)} placeholder="E.g., Modern parables..." className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-xs dark:text-white outline-none focus:ring-1 focus:ring-sky-500" />
                </div>
                
                <button onClick={handleGenerate} disabled={isLoading} className="w-full mt-4 flex items-center justify-center text-xs font-bold uppercase tracking-widest bg-yellow-500 hover:bg-yellow-600 text-white dark:text-gray-900 px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait shadow-md">
                  {isLoading ? <><SparklesIcon className="w-5 h-5 mr-2 animate-spin" /> Thinking...</> : '💡 Generate Optimized Ideas'}
                </button>
                 {error && <p className="text-xs text-red-500 mt-2 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
            </div>
        </div>
        
        <div className="w-full md:w-7/12 bg-white dark:bg-gray-950 flex flex-col h-full overflow-hidden min-h-0">
             <header className="hidden md:flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 shrink-0">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">Viral Video Ideas</h3>
                <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"><XMarkIcon className="w-6 h-6" /></button>
            </header>
            <div className="flex-grow p-6 overflow-y-auto scrollbar-thin">
                {ideas.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <LightBulbIcon className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-center max-w-md text-xs uppercase font-bold tracking-widest">Generate optimized ideas built for high retention and viral potential.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 pb-4">
                        {ideas.map((idea, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{idea.title}</h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 mt-1 border-l-2 border-yellow-500 pl-2">{idea.description}</p>
                                <div className="flex justify-end space-x-2">
                                     {onSendToProductGenerator && (
                                        <button onClick={() => onSendToProductGenerator(idea)} className="flex items-center px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-[10px] font-bold uppercase tracking-wide hover:bg-indigo-200" title="Create Product">
                                            <BookOpenIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => handleSend(idea, index)} className="flex items-center px-3 py-2 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-md text-[10px] font-bold uppercase tracking-wide hover:bg-sky-200">
                                        {sentIdeaIndex === index ? <><CheckIcon className="w-4 h-4 mr-2" /> Sent!</> : <><ArrowPathIcon className="w-4 h-4 mr-2" /> Send to Script</>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
