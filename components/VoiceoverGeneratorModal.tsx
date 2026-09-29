
import React, { useState, useEffect } from 'react';
import { prepareScriptForVoiceover, generateVoiceover, VOICE_OPTIONS, VoiceOption, TTS_MODELS } from '../services/geminiService';
import { XMarkIcon, SparklesIcon, DownloadIcon, PlayIcon, StopIcon, BookmarkIcon, ChevronDownIcon, TrashIcon } from './icons';
import { Preset, GeneratorType } from '../types';

interface VoiceoverGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScript: string;
  onAddToHistory: (type: GeneratorType, summary: string, config: any) => void;
}

export const VoiceoverGeneratorModal: React.FC<VoiceoverGeneratorModalProps> = ({ isOpen, onClose, initialScript, onAddToHistory }) => {
  const [script, setScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICE_OPTIONS[0]);
  const [selectedModel, setSelectedModel] = useState(TTS_MODELS[0].id);
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<{ voiceId: string; audio: HTMLAudioElement } | null>(null);

  // Presets
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);

  useEffect(() => {
      const savedPresets = localStorage.getItem('better-stories-voice-presets');
      if (savedPresets) {
        try {
          setPresets(JSON.parse(savedPresets));
        } catch (e) {
          console.error("Failed to parse presets", e);
        }
      }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setScript(initialScript);
      setAudioSrc(null); // Reset audio when modal opens
      setError(null);
    } else {
       // Stop any playing preview when modal closes
      if (activePreview) {
        activePreview.audio.pause();
      }
    }
  }, [isOpen, initialScript]);

  const handlePrepareScript = async () => {
    if (!script.trim()) return;
    setIsPreparing(true);
    setError(null);
    try {
      const preparedScript = await prepareScriptForVoiceover(script);
      setScript(preparedScript);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred during script preparation.');
    } finally {
      setIsPreparing(false);
    }
  };

  const handleGenerate = async () => {
    if (!script.trim()) {
      setError("Script cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAudioSrc(null);
    try {
      const base64Audio = await generateVoiceover(script, selectedVoice.id, selectedModel);
      const decodedAudio = atob(base64Audio);
      const pcmData = new Uint8Array(decodedAudio.length);
      for (let i = 0; i < decodedAudio.length; i++) {
        pcmData[i] = decodedAudio.charCodeAt(i);
      }
      
      const wavHeader = createWavHeader(pcmData.length, 24000, 1, 16);
      const wavBlob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(wavBlob);
      setAudioSrc(audioUrl);

      onAddToHistory('voiceover', `${selectedVoice.id} - ${script.substring(0, 30)}...`, {
          script,
          voiceId: selectedVoice.id,
          model: selectedModel
      });

    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred during voiceover generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewVoice = async (voiceId: string) => {
    if (activePreview) {
      activePreview.audio.pause();
      if (activePreview.voiceId === voiceId) {
        return;
      }
    }
    
    setPreviewingVoice(voiceId);
    setError(null);
    
    try {
      const previewText = "You can use this voice to bring your stories to life.";
      const base64Audio = await generateVoiceover(previewText, voiceId, selectedModel);
      
      const decodedAudio = atob(base64Audio);
      const pcmData = new Uint8Array(decodedAudio.length);
      for (let i = 0; i < decodedAudio.length; i++) {
        pcmData[i] = decodedAudio.charCodeAt(i);
      }
      
      const wavHeader = createWavHeader(pcmData.length, 24000, 1, 16);
      const wavBlob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(wavBlob);
      
      const audio = new Audio(audioUrl);

      const cleanup = () => {
        setActivePreview(null);
        URL.revokeObjectURL(audioUrl);
        audio.removeEventListener('ended', cleanup);
        audio.removeEventListener('pause', cleanup);
      };

      audio.addEventListener('ended', cleanup);
      audio.addEventListener('pause', cleanup);

      audio.play();
      setActivePreview({ voiceId, audio });
      
    } catch (e) {
      setError(e instanceof Error ? `Preview failed: ${e.message}` : 'An unknown error occurred during preview.');
    } finally {
      setPreviewingVoice(null);
    }
  };
  
  const createWavHeader = (dataLength: number, sampleRate: number, numChannels: number, bitsPerSample: number) => {
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const subChunk2Size = dataLength;
    const chunk_size = 36 + subChunk2Size;

    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, chunk_size, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, subChunk2Size, true);

    return buffer;
  }

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  const handleDownload = () => {
    if (!audioSrc) return;
    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = 'better_stories_ai_voiceover.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const savePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: newPresetName,
      type: 'voiceover',
      config: { voiceId: selectedVoice.id, model: selectedModel }
    };
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('better-stories-voice-presets', JSON.stringify(updatedPresets));
    setNewPresetName('');
    setShowPresetSave(false);
  };

  const loadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      const voice = VOICE_OPTIONS.find(v => v.id === preset.config.voiceId);
      if (voice) setSelectedVoice(voice);
      if (preset.config.model) setSelectedModel(preset.config.model);
    }
  };
  
  const deletePreset = (presetId: string) => {
     const updatedPresets = presets.filter(p => p.id !== presetId);
     setPresets(updatedPresets);
     localStorage.setItem('better-stories-voice-presets', JSON.stringify(updatedPresets));
  };

  const filteredVoices = VOICE_OPTIONS.filter(v => genderFilter === 'All' || v.gender === genderFilter);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Voiceover Generator</h2>
          <button onClick={onClose} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        
        <div className="p-6 space-y-4 overflow-y-auto scrollbar-thin">
          
           {/* Presets Bar */}
          <div className="flex items-center space-x-2 mb-2 bg-gray-50 dark:bg-gray-950 p-2 rounded-md border border-gray-200 dark:border-gray-800 z-30 relative">
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
                        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                            {presets.length === 0 && <div className="p-2 text-xs text-gray-500 dark:text-gray-400">No presets saved.</div>}
                            {presets.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer" onClick={() => { loadPreset(p.id); setIsPresetDropdownOpen(false); }}>
                                    <span className="text-sm text-gray-700 dark:text-gray-200 flex-grow truncate">
                                        {p.name}
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
             </div>
             <button onClick={() => setShowPresetSave(!showPresetSave)} className="text-sky-600 hover:text-sky-700 text-xs font-bold px-2 border-l border-gray-200 dark:border-gray-700">Save</button>
          </div>
          
          {showPresetSave && (
             <div className="flex items-center space-x-2 mb-2">
                <input 
                    type="text" 
                    value={newPresetName} 
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Preset Name"
                    className="flex-grow text-xs p-1 rounded border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 dark:text-white"
                />
                <button onClick={savePreset} className="bg-sky-600 text-white text-xs px-2 py-1 rounded hover:bg-sky-700">Save</button>
             </div>
          )}

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">AI Voice Model</label>
            <select 
                value={selectedModel} 
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-sky-500"
            >
                {TTS_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="script-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Voiceover Script</label>
            <textarea
              id="script-textarea"
              rows={8}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter or import your voiceover script here..."
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500"
            />
            <button
                onClick={handlePrepareScript}
                disabled={isPreparing || !script.trim()}
                className="w-full mt-2 flex items-center justify-center text-sm font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait border border-gray-300 dark:border-gray-700"
            >
                {isPreparing ? (
                    <>
                        <SparklesIcon className="w-5 h-5 mr-2 animate-spin" />
                        Improving Flow...
                    </>
                ) : '✨ Improve Pacing & Flow'}
            </button>
          </div>
          <div className="space-y-2">
              {/* Voice Selection UI */}
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Narrator Voice</label>
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                  {(['All', 'Male', 'Female'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setGenderFilter(g)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${genderFilter === g ? 'bg-white dark:bg-gray-700 text-sky-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-md p-2 space-y-1 scrollbar-thin">
                {filteredVoices.map(voice => (
                  <div key={voice.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                    <label className="flex items-center space-x-3 cursor-pointer flex-grow">
                      <input
                        type="radio"
                        name="voice-selection"
                        value={voice.id}
                        checked={selectedVoice.id === voice.id}
                        onChange={() => setSelectedVoice(voice)}
                        className="form-radio h-4 w-4 text-sky-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-sky-500 flex-shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="text-gray-800 dark:text-gray-200 font-medium capitalize">{voice.id}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{voice.gender} • {voice.description}</span>
                      </div>
                    </label>
                    <button 
                      onClick={() => handlePreviewVoice(voice.id)}
                      disabled={!!previewingVoice && previewingVoice !== voice.id}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
                    >
                      {previewingVoice === voice.id ? (
                        <SparklesIcon className="w-5 h-5 animate-spin" />
                      ) : activePreview?.voiceId === voice.id ? (
                        <StopIcon className="w-5 h-5 text-red-500" />
                      ) : (
                        <PlayIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center text-md font-bold bg-sky-600 hover:bg-sky-700 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 px-4 py-3 rounded-lg transition-colors disabled:bg-sky-300 dark:disabled:bg-gray-700 disabled:cursor-wait shadow-md">
            {isLoading ? <><SparklesIcon className="w-5 h-5 mr-2 animate-spin" /> Generating Audio...</> : '🗣️ Generate Voiceover'}
          </button>
          
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          
          {/* Output */}
          {audioSrc && (
            <div className="pt-4 space-y-3">
                <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-200">Generated Audio</h3>
                <audio src={audioSrc} controls className="w-full" />
                <button
                    onClick={handleDownload}
                    className="w-full mt-2 flex items-center justify-center text-sm font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
                >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download WAV
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
