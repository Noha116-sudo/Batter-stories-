
import React, { useState, useEffect } from 'react';
import { generateDigitalProduct, generateSEOProductDescription, generateImage, IMAGE_MODELS } from '../services/geminiService';
import { XMarkIcon, SparklesIcon, DownloadIcon, BookmarkIcon, ChevronDownIcon, TrashIcon, BookOpenIcon, PlusIcon, PhotoIcon, ArrowPathIcon } from './icons';
import { Preset, GeneratorType, ANIMATION_STYLES } from '../types';
import { jsPDF } from "jspdf";

interface ProductGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle: string;
  initialDescription: string;
  onAddToHistory: (type: GeneratorType, summary: string, config: any) => void;
}

const PRODUCT_TYPES = [
  "Ebook", "Step-by-Step Guide", "Checklist", "Worksheet", "Cheatsheet", 
  "Case Study", "Whitepaper", "Email Course", "Video Course Outline", 
  "Webinar Script", "Social Media Content Calendar", "Prayer Journal Template", 
  "Devotional Guide", "Sermon Series Outline", "Workshop Curriculum", 
  "Challenge (7-Day/30-Day)", "Resource Library"
];

const WRITING_STYLES = [
  "Instructional", "Persuasive", "Narrative", "Academic", "Friendly/Conversational", 
  "Direct/Action-Oriented", "Step-by-Step", "Analytical", "Descriptive", "Minimalist", 
  "Humorous", "Formal", "Socratic", "Metaphor-Rich", "Scriptural/Expository", 
  "Coaching/Mentoring"
];

const TONES = [
  "Inspirational", "Educational", "Humorous", "Dramatic", "Somber", "Hopeful", 
  "Encouraging", "Authoritative", "Empathetic", "Urgent", "Witty", "Conversational", 
  "Professional", "Gentle", "Passionate", "Reflective", "Bold", "Mysterious", 
  "Calm", "Energetic", "Sarcastic", "Nostalgic", "Warm", "Direct", "Storytelling"
];

const removeItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(list.filter(i => i !== item));
};

const addItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (item && !list.includes(item)) {
        setList([...list, item]);
    }
};

interface MultiSelectInputProps {
    label: string;
    options: string[];
    selectedItems: string[];
    setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
    customValue?: string;
    setCustomValue?: React.Dispatch<React.SetStateAction<string>>;
    placeholder?: string;
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
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        
        <div className="flex flex-wrap gap-2 mb-2">
            {selectedItems.map(item => (
                <span key={item} className="flex items-center bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 text-xs font-medium px-2.5 py-1 border border-gray-300 dark:border-zinc-700">
                    {item}
                    <button onClick={() => removeItem(item, selectedItems, setSelectedItems)} className="ml-1.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
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
                className="w-1/2 bg-white dark:bg-black border-b-2 border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white rounded-none"
            >
                <option value="" disabled>Select...</option>
                {options.filter(o => !selectedItems.includes(o)).map(o => (
                    <option key={o} value={o}>{o}</option>
                ))}
            </select>
            
            {customValue !== undefined && setCustomValue && (
                <div className="flex-grow flex gap-1">
                    <input 
                        type="text" 
                        value={customValue} 
                        onChange={(e) => setCustomValue(e.target.value)} 
                        placeholder={placeholder} 
                        className="w-full bg-white dark:bg-black border-b-2 border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white rounded-none"
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
            )}
        </div>
    </div>
);


export const ProductGeneratorModal: React.FC<ProductGeneratorModalProps> = ({ isOpen, onClose, initialTitle, initialDescription, onAddToHistory }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Replaced single type with multiple
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([PRODUCT_TYPES[0]]);
  
  const [audience, setAudience] = useState('');
  
  const [selectedTones, setSelectedTones] = useState<string[]>([TONES[0]]);
  const [customTone, setCustomTone] = useState('');
  
  const [selectedWritingStyles, setSelectedWritingStyles] = useState<string[]>([WRITING_STYLES[0]]);
  const [customWritingStyle, setCustomWritingStyle] = useState('');
  
  const [numPages, setNumPages] = useState(5); // Interpreted as Sections/Chapters
  const [includeInfographics, setIncludeInfographics] = useState(false);

  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Marketing Assets State
  const [seoDescription, setSeoDescription] = useState('');
  const [coverImageSrc, setCoverImageSrc] = useState<string | null>(null);
  const [coverImageModel, setCoverImageModel] = useState<string>(IMAGE_MODELS[0].id);
  const [coverArtStyle, setCoverArtStyle] = useState<string[]>([ANIMATION_STYLES[29]]); // Minimalist default
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);
  const [marketingError, setMarketingError] = useState<string | null>(null);

  // Presets
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);

  useEffect(() => {
      if (isOpen) {
          if (initialTitle) setTitle(initialTitle);
          if (initialDescription) setDescription(initialDescription);
      }
  }, [isOpen, initialTitle, initialDescription]);

  useEffect(() => {
      const savedPresets = localStorage.getItem('better-stories-product-presets');
      if (savedPresets) {
        try {
          setPresets(JSON.parse(savedPresets));
        } catch (e) {
          console.error("Failed to load presets", e);
        }
      }
  }, []);

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError("Please enter a title for your product.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedContent('');
    // Reset marketing assets on new generation
    setSeoDescription('');
    setCoverImageSrc(null);
    setMarketingError(null);

    try {
        const toneString = selectedTones.join(', ');
        const styleString = selectedWritingStyles.join(', ');
        
        const content = await generateDigitalProduct(
            title,
            selectedProductTypes,
            audience || "General",
            toneString,
            styleString,
            description,
            numPages.toString(),
            includeInfographics
        );
        setGeneratedContent(content);
        
        onAddToHistory('product', title, {
            title,
            selectedProductTypes,
            audience,
            tone: toneString,
            writingStyle: styleString,
            numPages,
            includeInfographics
        });
    } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate product.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateMarketingAssets = async () => {
      if (!generatedContent || !title) return;
      
      setIsGeneratingMarketing(true);
      setMarketingError(null);
      setSeoDescription('');
      
      try {
          // 1. Generate SEO Description
          const seoDesc = await generateSEOProductDescription(title, generatedContent);
          setSeoDescription(seoDesc);

          // 2. Generate Cover Image
          // Prompt construction
          const coverPrompt = `A professional, high-quality book cover or product cover for a digital product titled "${title}". ${description}. Clean, minimalist typography, eye-catching design. 1080x1080 resolution.`;
          
          const combinedStyle = coverArtStyle.join(', ');
          const base64Image = await generateImage(coverPrompt, [], combinedStyle, '1:1', coverImageModel);
          setCoverImageSrc(`data:image/png;base64,${base64Image}`);

      } catch (e) {
          setMarketingError(e instanceof Error ? e.message : "Failed to generate marketing assets.");
      } finally {
          setIsGeneratingMarketing(false);
      }
  };

  const handleRegenerateCover = async () => {
      setIsGeneratingMarketing(true);
      setMarketingError(null);
      try {
          const coverPrompt = `A professional, high-quality book cover or product cover for a digital product titled "${title}". ${description}. Clean, minimalist typography, eye-catching design. 1080x1080 resolution.`;
          const combinedStyle = coverArtStyle.join(', ');
          const base64Image = await generateImage(coverPrompt, [], combinedStyle, '1:1', coverImageModel);
          setCoverImageSrc(`data:image/png;base64,${base64Image}`);
      } catch (e) {
          setMarketingError(e instanceof Error ? e.message : "Failed to regenerate cover.");
      } finally {
          setIsGeneratingMarketing(false);
      }
  };

  const handleDownloadCover = () => {
      if (!coverImageSrc) return;
      const link = document.createElement('a');
      link.href = coverImageSrc;
      link.download = `cover_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
      if (!generatedContent) return;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);
      
      let y = 30;

      // Header
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, y);
      y += 10;
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`A ${selectedProductTypes.join(', ')} for ${audience || 'General Audience'}`, margin, y);
      y += 15;
      
      doc.setTextColor(0);
      doc.setFontSize(11);
      
      // Parse content to handle [INFOGRAPHIC] blocks separately
      const lines = generatedContent.split('\n');
      let inInfographic = false;
      let infographicText = "";

      lines.forEach((line) => {
          if (y > 280) {
              doc.addPage();
              y = 20;
          }

          if (line.trim().includes('[INFOGRAPHIC]')) {
              inInfographic = true;
              return;
          }
          if (line.trim().includes('[/INFOGRAPHIC]')) {
              inInfographic = false;
              // Render the accumulated infographic text block
              doc.setDrawColor(200);
              doc.setFillColor(245, 245, 245);
              doc.rect(margin, y, maxLineWidth, 30, 'FD'); // Simple box, height might need adjustment based on text
              
              doc.setFont("courier", "bold");
              doc.setFontSize(10);
              doc.text("INFOGRAPHIC / VISUAL AID", margin + 5, y + 8);
              
              doc.setFont("helvetica", "normal");
              doc.setFontSize(9);
              const splitInfo = doc.splitTextToSize(infographicText, maxLineWidth - 10);
              doc.text(splitInfo, margin + 5, y + 15);
              
              y += 35; // Advance past box
              infographicText = "";
              return;
          }

          if (inInfographic) {
              infographicText += line + "\n";
          } else {
              // Standard Text
              if (line.startsWith('#')) {
                 doc.setFont("helvetica", "bold");
                 doc.setFontSize(14);
                 y += 5;
              } else {
                 doc.setFont("helvetica", "normal");
                 doc.setFontSize(11);
              }
              
              const cleanLine = line.replace(/^#+\s*/, '');
              const splitLine = doc.splitTextToSize(cleanLine, maxLineWidth);
              
              // Only print if there is text
              if(cleanLine.trim()){
                 doc.text(splitLine, margin, y);
                 y += (splitLine.length * 6) + 2; 
              } else {
                 y += 5; // Paragraph break
              }
          }
      });
      
      doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  };
  
  const handleDownloadText = () => {
      if (!generatedContent) return;
      const blob = new Blob([generatedContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Preset Handlers
  const savePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: newPresetName,
      type: 'product',
      config: { selectedProductTypes, audience, selectedTones, selectedWritingStyles, numPages, includeInfographics }
    };
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('better-stories-product-presets', JSON.stringify(updatedPresets));
    setNewPresetName('');
    setShowPresetSave(false);
  };

  const loadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      if(preset.config.selectedProductTypes) setSelectedProductTypes(preset.config.selectedProductTypes);
      else if(preset.config.productType) setSelectedProductTypes([preset.config.productType]);

      setAudience(preset.config.audience);
      
      if (preset.config.tone) setSelectedTones([preset.config.tone]);
      else if (preset.config.selectedTones) setSelectedTones(preset.config.selectedTones);
      
      if (preset.config.writingStyle) setSelectedWritingStyles([preset.config.writingStyle]);
      else if (preset.config.selectedWritingStyles) setSelectedWritingStyles(preset.config.selectedWritingStyles);
      
      setNumPages(preset.config.numPages);
      setIncludeInfographics(preset.config.includeInfographics || false);
    }
  };

  const deletePreset = (presetId: string) => {
     const updatedPresets = presets.filter(p => p.id !== presetId);
     setPresets(updatedPresets);
     localStorage.setItem('better-stories-product-presets', JSON.stringify(updatedPresets));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-black rounded-none shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <header className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center uppercase tracking-wider">
            <BookOpenIcon className="w-5 h-5 mr-3 text-black dark:text-white" />
            Product Generator
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
            
            {/* Left Column: Inputs */}
            <div className="w-full md:w-1/3 p-6 border-r border-gray-200 dark:border-zinc-800 overflow-y-auto scrollbar-thin bg-gray-50 dark:bg-zinc-900">
                 {/* Presets Bar */}
                <div className="flex items-center space-x-2 mb-6 bg-white dark:bg-black p-2 border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <BookmarkIcon className="w-4 h-4 text-gray-500" />
                    <div className="relative flex-grow">
                        <button 
                            onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
                            className="w-full text-left bg-transparent text-sm focus:outline-none text-gray-700 dark:text-gray-200 flex justify-between items-center px-1"
                        >
                            <span>Load Preset...</span>
                            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                        </button>

                        {isPresetDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsPresetDropdownOpen(false)}></div>
                                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-black border border-gray-200 dark:border-zinc-700 shadow-lg z-20 max-h-48 overflow-y-auto">
                                    {presets.length === 0 && <div className="p-2 text-xs text-gray-500 dark:text-gray-400">No presets saved.</div>}
                                    {presets.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 group cursor-pointer" onClick={() => { loadPreset(p.id); setIsPresetDropdownOpen(false); }}>
                                            <span className="text-sm text-gray-700 dark:text-gray-200 flex-grow truncate">
                                                {p.name}
                                            </span>
                                            <button onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }} className="text-gray-400 hover:text-red-500 p-1">
                                                <TrashIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={() => setShowPresetSave(!showPresetSave)} className="text-black dark:text-white hover:underline text-xs font-bold px-2 border-l border-gray-200 dark:border-zinc-800">Save</button>
                </div>
                
                {showPresetSave && (
                    <div className="flex items-center space-x-2 mb-4">
                        <input 
                            type="text" 
                            value={newPresetName} 
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="Preset Name"
                            className="flex-grow text-xs p-1 border bg-white dark:bg-black border-gray-300 dark:border-zinc-700 dark:text-white rounded-none"
                        />
                        <button onClick={savePreset} className="bg-black dark:bg-white text-white dark:text-black text-xs px-2 py-1 hover:opacity-80">Save</button>
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Product Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent border-b-2 border-gray-300 dark:border-zinc-700 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white rounded-none placeholder-gray-400" placeholder="e.g. The Ultimate Guide..." />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Context / Description</label>
                        <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white dark:bg-black border border-gray-300 dark:border-zinc-700 px-3 py-2 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-black dark:focus:ring-white rounded-none" placeholder="What is this product about?" />
                    </div>
                    
                    <MultiSelectInput 
                        label="Product Type(s)" 
                        options={PRODUCT_TYPES} 
                        selectedItems={selectedProductTypes} 
                        setSelectedItems={setSelectedProductTypes}
                    />

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Chapters</label>
                             <input type="number" min="1" max="50" value={numPages} onChange={e => setNumPages(parseInt(e.target.value))} className="w-full bg-white dark:bg-black border-b-2 border-gray-300 dark:border-zinc-700 px-2 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white rounded-none" />
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" checked={includeInfographics} onChange={e => setIncludeInfographics(e.target.checked)} className="form-checkbox h-4 w-4 text-black border-gray-300 focus:ring-black dark:bg-black dark:border-zinc-600" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Infographics</span>
                            </label>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                        <input type="text" value={audience} onChange={e => setAudience(e.target.value)} className="w-full bg-transparent border-b-2 border-gray-300 dark:border-zinc-700 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white rounded-none placeholder-gray-400" placeholder="e.g. Beginners..." />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <MultiSelectInput 
                            label="Tone" 
                            options={TONES} 
                            selectedItems={selectedTones} 
                            setSelectedItems={setSelectedTones}
                            customValue={customTone}
                            setCustomValue={setCustomTone}
                            placeholder="Add tone..."
                        />
                        <MultiSelectInput 
                            label="Writing Style" 
                            options={WRITING_STYLES} 
                            selectedItems={selectedWritingStyles} 
                            setSelectedItems={setSelectedWritingStyles}
                            customValue={customWritingStyle}
                            setCustomValue={setCustomWritingStyle}
                            placeholder="Add style..."
                        />
                    </div>
                    
                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading}
                        className="w-full mt-4 flex items-center justify-center text-md font-bold bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait uppercase tracking-widest"
                    >
                        {isLoading ? <><SparklesIcon className="w-5 h-5 mr-2 animate-spin" /> Generating...</> : 'Create Product'}
                    </button>
                    
                    {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
                </div>
            </div>

            {/* Right Column: Output & Preview */}
            <div className="w-full md:w-2/3 bg-white dark:bg-black flex flex-col">
                <div className="flex-grow p-8 overflow-y-auto scrollbar-thin">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600">
                            <SparklesIcon className="w-12 h-12 mb-4 animate-pulse text-black dark:text-white" />
                            <p className="uppercase tracking-widest text-xs">Crafting Content...</p>
                        </div>
                    ) : generatedContent ? (
                        <div className="space-y-12">
                            {/* Main Content */}
                            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap font-serif text-gray-800 dark:text-gray-300">
                                {generatedContent}
                            </div>
                            
                            {/* Marketing Assets Section */}
                            <div className="border-t-2 border-dashed border-gray-200 dark:border-zinc-800 pt-8 mt-12">
                                <h3 className="text-xl font-bold mb-4 uppercase tracking-widest text-black dark:text-white flex items-center">
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    Marketing Assets
                                </h3>
                                
                                {!seoDescription && !coverImageSrc ? (
                                    <div className="bg-gray-50 dark:bg-zinc-900 p-6 text-center border border-gray-200 dark:border-zinc-800">
                                        <p className="text-sm text-gray-500 mb-4">Generate SEO-optimized description and a professional cover image for your product.</p>
                                        <button 
                                            onClick={handleGenerateMarketingAssets}
                                            disabled={isGeneratingMarketing}
                                            className="bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black px-6 py-3 font-bold uppercase tracking-wide text-xs transition-colors"
                                        >
                                            {isGeneratingMarketing ? 'Generating Assets...' : 'Generate Assets'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* SEO Description */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-bold uppercase text-gray-500">SEO Description</h4>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-zinc-900 p-4 border border-gray-200 dark:border-zinc-800 text-sm whitespace-pre-wrap font-sans">
                                                {seoDescription}
                                            </div>
                                        </div>

                                        {/* Cover Image */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-bold uppercase text-gray-500">Cover Image (1080x1080)</h4>
                                            </div>
                                            
                                            {coverImageSrc ? (
                                                <div className="relative group">
                                                    <img src={coverImageSrc} alt="Product Cover" className="w-full h-auto shadow-lg border border-gray-200 dark:border-zinc-800" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button onClick={handleDownloadCover} className="p-2 bg-white text-black rounded hover:bg-gray-200" title="Download"><DownloadIcon className="w-5 h-5"/></button>
                                                        <button onClick={handleRegenerateCover} className="p-2 bg-white text-black rounded hover:bg-gray-200" title="Regenerate"><ArrowPathIcon className="w-5 h-5"/></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="aspect-square bg-gray-100 dark:bg-zinc-900 flex items-center justify-center text-gray-400">
                                                    {isGeneratingMarketing ? <SparklesIcon className="w-8 h-8 animate-spin"/> : <PhotoIcon className="w-8 h-8"/>}
                                                </div>
                                            )}
                                            
                                            {/* Cover Controls */}
                                            <div className="bg-gray-50 dark:bg-zinc-900 p-3 border border-gray-200 dark:border-zinc-800 space-y-3">
                                                 <div>
                                                     <label className="block text-xs font-bold mb-1">Cover Style</label>
                                                      <MultiSelectInput 
                                                            label="" 
                                                            options={ANIMATION_STYLES} 
                                                            selectedItems={coverArtStyle} 
                                                            setSelectedItems={setCoverArtStyle}
                                                            placeholder="Style..."
                                                        />
                                                 </div>
                                                 <div>
                                                     <label className="block text-xs font-bold mb-1">Model</label>
                                                     <select 
                                                        value={coverImageModel} 
                                                        onChange={(e) => setCoverImageModel(e.target.value)}
                                                        className="w-full bg-white dark:bg-black border border-gray-300 dark:border-zinc-700 px-2 py-1 text-xs"
                                                    >
                                                        {IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                    </select>
                                                 </div>
                                                 <button 
                                                    onClick={handleRegenerateCover}
                                                    disabled={isGeneratingMarketing}
                                                    className="w-full bg-white dark:bg-black border border-gray-300 dark:border-zinc-700 text-xs py-2 font-bold hover:bg-gray-50 dark:hover:bg-zinc-900"
                                                 >
                                                     Regenerate Cover
                                                 </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {marketingError && <p className="text-xs text-red-500 mt-4">{marketingError}</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-zinc-700">
                            <BookOpenIcon className="w-20 h-20 mb-4 opacity-20" />
                            <p className="uppercase tracking-widest text-xs">Content Area</p>
                        </div>
                    )}
                </div>
                
                {/* Footer Actions */}
                {generatedContent && (
                    <div className="p-6 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex justify-end space-x-4">
                         <button 
                            onClick={handleDownloadText}
                            className="px-6 py-3 border border-gray-300 dark:border-zinc-600 hover:bg-gray-200 dark:hover:bg-zinc-800 text-black dark:text-white rounded-none font-bold transition-colors flex items-center text-xs uppercase tracking-wider"
                        >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Markdown
                        </button>
                        <button 
                            onClick={handleDownloadPDF}
                            className="px-6 py-3 bg-black dark:bg-white hover:opacity-80 text-white dark:text-black rounded-none font-bold transition-colors flex items-center text-xs uppercase tracking-wider"
                        >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
