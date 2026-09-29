
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { MainMenu } from './components/MainMenu';
import { ScriptGeneratorModal } from './components/ScriptGeneratorModal';
import { VoiceoverGeneratorModal } from './components/VoiceoverGeneratorModal';
import { ThumbnailGeneratorModal } from './components/ThumbnailGeneratorModal';
import { BrainstormerModal } from './components/BrainstormerModal';
import { ProductGeneratorModal } from './components/ProductGeneratorModal';
import { YouTubeToolsModal } from './components/YouTubeToolsModal';
import { HistoryModal } from './components/HistoryModal';
import { AuthModal } from './components/AuthModal';
import { ControlPanel } from './components/ControlPanel';
import { ResultsDisplay } from './components/ResultsDisplay';
import { HomePage } from './components/HomePage';
import { generateImage, IMAGE_MODELS, VideoIdea } from './services/geminiService';
import { supabase, saveHistoryItem, fetchUserHistory, clearUserHistory, deleteHistoryItem } from './services/supabaseClient';
import { Character, GeneratedImage, AspectRatio, ANIMATION_STYLES, HistoryItem, GeneratorType, SceneItem } from './types';
import { fileToBase64, generateFilename } from './utils/helpers';
import JSZip from 'jszip';

const initialCharacters: Character[] = [{
  id: 1,
  name: 'The Disciple',
  description: 'A man with a brown beard, wearing a simple tan tunic.',
  image: null,
  enabled: true,
  imageBase64: null,
  mimeType: null,
}];

const initialScenes: SceneItem[] = [
    { description: 'The Disciple stands on a dusty road at sunset, looking contemplative.', timestamp: '00:00' }
];

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [scenes, setScenes] = useState<SceneItem[]>(initialScenes);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [animationStyle, setAnimationStyle] = useState<string[]>([ANIMATION_STYLES[0]]);
  const [imageModel, setImageModel] = useState<string>(IMAGE_MODELS[0].id); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [autoParserScript, setAutoParserScript] = useState('');

  const [currentView, setCurrentView] = useState<'home' | 'creator'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScriptGeneratorOpen, setIsScriptGeneratorOpen] = useState(false);
  const [isVoiceoverGeneratorOpen, setIsVoiceoverGeneratorOpen] = useState(false);
  const [isThumbnailGeneratorOpen, setIsThumbnailGeneratorOpen] = useState(false);
  const [isBrainstormerOpen, setIsBrainstormerOpen] = useState(false);
  const [isProductGeneratorOpen, setIsProductGeneratorOpen] = useState(false);
  const [isYouTubeToolsOpen, setIsYouTubeToolsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [voiceoverInitialScript, setVoiceoverInitialScript] = useState('');
  const [thumbnailInitialTitle, setThumbnailInitialTitle] = useState('');
  const [thumbnailInitialScript, setThumbnailInitialScript] = useState('');
  const [scriptInitialTitle, setScriptInitialTitle] = useState('');
  const [scriptInitialDescription, setScriptInitialDescription] = useState('');
  const [scriptInitialDuration, setScriptInitialDuration] = useState('10');
  
  // CTA State passed from Brainstormer (Now Arrays)
  const [scriptInitialCtaIntro, setScriptInitialCtaIntro] = useState<string[]>([]);
  const [scriptInitialCtaOutro, setScriptInitialCtaOutro] = useState<string[]>([]);
  const [scriptInitialCtaShortIntro, setScriptInitialCtaShortIntro] = useState<string[]>([]);
  const [scriptInitialCtaShortOutro, setScriptInitialCtaShortOutro] = useState<string[]>([]);

  const [productInitialTitle, setProductInitialTitle] = useState('');
  const [productInitialDescription, setProductInitialDescription] = useState('');
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('better-stories-theme');
      return saved === 'light' ? 'light' : 'dark';
    }
    return 'dark';
  });

  // Handle Supabase Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load History (Supabase or LocalStorage)
  useEffect(() => {
    const loadHistory = async () => {
        if (user) {
            const { data, error } = await fetchUserHistory(user.id);
            if (!error && data) {
                const mappedHistory = data.map(item => ({
                    id: item.id.toString(),
                    timestamp: new Date(item.timestamp).getTime(),
                    type: item.type as GeneratorType,
                    summary: item.summary,
                    config: item.config
                }));
                setHistory(mappedHistory);
            }
        } else {
            const savedHistory = localStorage.getItem('better-stories-history');
            if (savedHistory) {
                try { setHistory(JSON.parse(savedHistory)); } catch(e) { console.error(e); }
            }
        }
    };
    loadHistory();
  }, [user]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('better-stories-theme', theme);
  }, [theme]);

  const addToHistory = async (type: GeneratorType, summary: string, config: any) => {
      const newItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          type,
          summary,
          config
      };

      if (user) {
          await saveHistoryItem(user.id, newItem);
          const { data } = await fetchUserHistory(user.id);
          if (data) {
              setHistory(data.map(item => ({
                  id: item.id.toString(),
                  timestamp: new Date(item.timestamp).getTime(),
                  type: item.type as GeneratorType,
                  summary: item.summary,
                  config: item.config
              })));
          }
      } else {
          setHistory(prev => {
              const updated = [newItem, ...prev].slice(50);
              localStorage.setItem('better-stories-history', JSON.stringify(updated));
              return updated;
          });
      }
  };
  
  const handleRemoveHistoryItem = async (itemId: string) => {
    if (user) {
        await deleteHistoryItem(itemId);
        setHistory(prev => prev.filter(item => item.id !== itemId));
    } else {
        setHistory(prev => {
            const updated = prev.filter(item => item.id !== itemId);
            localStorage.setItem('better-stories-history', JSON.stringify(updated));
            return updated;
        });
    }
  };

  const clearHistory = async () => {
      if (user) {
          await clearUserHistory(user.id);
          setHistory([]);
      } else {
          setHistory([]);
          localStorage.removeItem('better-stories-history');
      }
  };

  const handleCharacterChange = useCallback((id: number, updatedCharacter: Partial<Character>) => {
    setCharacters(prev =>
      prev.map(char => (char.id === id ? { ...char, ...updatedCharacter } : char))
    );
  }, []);

  const handleAddCharacter = () => {
    if (characters.length < 10) {
      const newCharacter: Character = {
        id: Date.now(),
        name: `Character ${characters.length + 1}`,
        description: '',
        image: null,
        enabled: true,
        imageBase64: null,
        mimeType: null,
      };
      setCharacters([...characters, newCharacter]);
    }
  };
  
  const handleBulkAddCharacters = useCallback((files: File[]) => {
    setCharacters(prev => {
      if (prev.length >= 10) return prev;
      const spaceAvailable = 10 - prev.length;
      const filesToProcess = files.slice(0, spaceAvailable);
      const newCharacters: Character[] = filesToProcess.map((file, index) => ({
        id: Date.now() + index,
        name: file.name.replace(/\.[^/.]+$/, "") || `Character ${prev.length + index + 1}`,
        description: '',
        image: file,
        enabled: true,
        imageBase64: null,
        mimeType: file.type,
      }));
      return [...prev, ...newCharacters];
    });
  }, []);

  const handleRemoveCharacter = (id: number) => {
    setCharacters(prev => prev.filter(char => char.id !== id));
  };

  const handleGenerate = async (indicesToGenerate: number[]) => {
    setError(null);
    setIsLoading(true);

    if (imageModel === 'gemini-3-pro-image-preview') {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
        }
    }

    if (animationStyle.length === 0) {
        setError("Please select at least one animation/art style.");
        setIsLoading(false);
        return;
    }
    const enabledCharacters = characters.filter(c => c.enabled);
    const currentSceneDescriptions = indicesToGenerate.map(i => scenes[i].description);
    if (imageModel === 'gemini-2.5-flash-image' && enabledCharacters.length === 0 && currentSceneDescriptions.some(s => s.toLowerCase().includes("character"))) {
        setError("Please enable at least one character to include in the scenes.");
        setIsLoading(false);
        return;
    }
    try {
      const referenceImages = await Promise.all(
        enabledCharacters.filter(c => c.image).map(async c => ({
            data: await fileToBase64(c.image!),
            mimeType: c.image!.type,
        }))
      );
      const generationDate = new Date();
      const isImagen = imageModel.includes('imagen');
      const combinedStyle = animationStyle.join(', ');
      for (const index of indicesToGenerate) {
        const sceneItem = scenes[index];
        const scenePrompt = sceneItem.description;
        if (isImagen) await new Promise(resolve => setTimeout(resolve, 3000)); 
        try {
            const base64Image = await generateImage(scenePrompt, referenceImages, combinedStyle, aspectRatio, imageModel);
            const src = `data:image/png;base64,${base64Image}`;
            const filename = generateFilename(index, scenePrompt, generationDate, sceneItem.timestamp);
            const newImage: GeneratedImage = { src, prompt: scenePrompt, filename, sceneIndex: index };
            setImages(prev => {
                const filtered = prev.filter(img => img.sceneIndex !== index);
                return [...filtered, newImage].sort((a, b) => a.sceneIndex - b.sceneIndex);
            });
        } catch (innerError) { console.error(innerError); }
      }
      addToHistory('image_batch', `${indicesToGenerate.length} scenes generated`, {
          scenes: indicesToGenerate.map(i => scenes[i].description),
          animationStyle: combinedStyle,
          aspectRatio,
          imageModel,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally { setIsLoading(false); }
  };

  const handleRegenerateSingleScene = async (index: number) => {
    setError(null);
    setIsLoading(true);

    if (imageModel === 'gemini-3-pro-image-preview') {
        if (!(await (window as any).aistudio.hasSelectedApiKey())) {
            await (window as any).aistudio.openSelectKey();
        }
    }

    const combinedStyle = animationStyle.join(', ');
    const enabledCharacters = characters.filter(c => c.enabled);
    const sceneItem = scenes[index];
    const scenePrompt = sceneItem.description;
    try {
         const referenceImages = await Promise.all(
            enabledCharacters.filter(c => c.image).map(async c => ({
                data: await fileToBase64(c.image!),
                mimeType: c.image!.type,
            }))
          );
          const base64Image = await generateImage(scenePrompt, referenceImages, combinedStyle, aspectRatio, imageModel);
          const src = `data:image/png;base64,${base64Image}`;
          const generationDate = new Date();
          const filename = generateFilename(index, scenePrompt, generationDate, sceneItem.timestamp);
          const newImage: GeneratedImage = { src, prompt: scenePrompt, filename, sceneIndex: index };
          setImages(prev => {
              const filtered = prev.filter(img => img.sceneIndex !== index);
              return [...filtered, newImage].sort((a, b) => a.sceneIndex - b.sceneIndex);
          });
    } catch (e) { setError(e instanceof Error ? e.message : 'Unknown error'); } finally { setIsLoading(false); }
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) return;
    const zip = new JSZip();
    for (const image of images) {
        const response = await fetch(image.src);
        const blob = await response.blob();
        zip.file(image.filename, blob);
    }
    zip.generateAsync({ type: 'blob' }).then((content) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `Better_stories_Ai_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  };

  const handleImportScript = (script: string) => {
      setAutoParserScript(script);
      setIsScriptGeneratorOpen(false);
      setIsYouTubeToolsOpen(false);
  };
  
  const handleSendToVoiceover = (script: string) => {
    setVoiceoverInitialScript(script);
    setIsScriptGeneratorOpen(false);
    setIsYouTubeToolsOpen(false);
    setIsVoiceoverGeneratorOpen(true);
  };
  
  const handleSendToThumbnail = (title: string, script: string) => {
    setThumbnailInitialTitle(title);
    setThumbnailInitialScript(script);
    setIsScriptGeneratorOpen(false);
    setIsYouTubeToolsOpen(false);
    setIsThumbnailGeneratorOpen(true);
  };
  
  const handleSendBrainstormToScript = (idea: VideoIdea, duration: string, ctas?: any) => {
      setScriptInitialTitle(idea.title);
      setScriptInitialDescription(idea.description);
      setScriptInitialDuration(duration);
      if (ctas) {
          setScriptInitialCtaIntro(ctas.intro || []);
          setScriptInitialCtaOutro(ctas.outro || []);
          setScriptInitialCtaShortIntro(ctas.shortIntro || []);
          setScriptInitialCtaShortOutro(ctas.shortOutro || []);
      }
      setIsBrainstormerOpen(false);
      setIsScriptGeneratorOpen(true);
  };

  const handleSendBrainstormToProduct = (idea: VideoIdea) => {
    setProductInitialTitle(idea.title);
    setProductInitialDescription(idea.description);
    setIsBrainstormerOpen(false);
    setIsProductGeneratorOpen(true);
  };

  const handleSendScriptToProduct = (title: string, description: string) => {
    setProductInitialTitle(title);
    setProductInitialDescription(description);
    setIsScriptGeneratorOpen(false);
    setIsYouTubeToolsOpen(false);
    setIsProductGeneratorOpen(true);
  };

  const renderContent = () => {
    if (currentView === 'home') {
      return <HomePage onStartCreating={() => setCurrentView('creator')} />;
    }
    return (
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 h-full">
        <div className="lg:col-span-1 xl:col-span-1 h-full overflow-y-auto">
          <ControlPanel
            characters={characters}
            onCharacterChange={handleCharacterChange}
            onAddCharacter={handleAddCharacter}
            onBulkAddCharacters={handleBulkAddCharacters}
            onRemoveCharacter={handleRemoveCharacter}
            scenes={scenes}
            setScenes={setScenes}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            animationStyle={animationStyle}
            setAnimationStyle={setAnimationStyle}
            imageModel={imageModel}
            setImageModel={setImageModel}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            autoParserScript={autoParserScript}
            setAutoParserScript={setAutoParserScript}
          />
        </div>
        <div className="lg:col-span-2 xl:col-span-3 h-full overflow-y-auto">
          <ResultsDisplay 
            images={images}
            isLoading={isLoading}
            error={error}
            onDownloadAll={handleDownloadAll}
            onRegenerateScene={handleRegenerateSingleScene}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`w-screen h-screen bg-white dark:bg-black flex flex-col font-sans transition-colors duration-300 text-gray-900 dark:text-gray-100`}>
      <Header onMenuClick={() => setIsMenuOpen(true)} onAuthClick={() => setIsAuthOpen(true)} user={user} />
      <MainMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigateHome={() => { setCurrentView('home'); setIsMenuOpen(false); }}
        onOpenCharacterGenerator={() => { setCurrentView('creator'); setIsMenuOpen(false); }}
        onOpenScriptGenerator={() => setIsScriptGeneratorOpen(true)}
        onOpenVoiceoverGenerator={() => setIsVoiceoverGeneratorOpen(true)}
        onOpenThumbnailGenerator={() => setIsThumbnailGeneratorOpen(true)}
        onOpenBrainstormer={() => setIsBrainstormerOpen(true)}
        onOpenProductGenerator={() => setIsProductGeneratorOpen(true)}
        onOpenYouTubeTools={() => setIsYouTubeToolsOpen(true)}
        onOpenHistory={() => { setIsHistoryOpen(true); setIsMenuOpen(false); }}
        theme={theme}
        setTheme={setTheme}
        user={user}
        onLogout={() => supabase.auth.signOut()}
      />
      <ScriptGeneratorModal 
        isOpen={isScriptGeneratorOpen}
        onClose={() => setIsScriptGeneratorOpen(false)}
        onImport={handleImportScript}
        onSendToVoiceover={handleSendToVoiceover}
        onSendToThumbnail={handleSendToThumbnail} 
        onAddToHistory={addToHistory}
        initialTitle={scriptInitialTitle}
        initialDescription={scriptInitialDescription}
        initialDuration={scriptInitialDuration}
        initialCtaIntro={scriptInitialCtaIntro}
        initialCtaOutro={scriptInitialCtaOutro}
        initialCtaShortIntro={scriptInitialCtaShortIntro}
        initialCtaShortOutro={scriptInitialCtaShortOutro}
        onSendToProduct={handleSendScriptToProduct}
      />
      <VoiceoverGeneratorModal isOpen={isVoiceoverGeneratorOpen} onClose={() => setIsVoiceoverGeneratorOpen(false)} initialScript={voiceoverInitialScript} onAddToHistory={addToHistory} />
      <ThumbnailGeneratorModal isOpen={isThumbnailGeneratorOpen} onClose={() => setIsThumbnailGeneratorOpen(false)} initialTitle={thumbnailInitialTitle} initialScript={thumbnailInitialScript} onAddToHistory={addToHistory} />
      <BrainstormerModal isOpen={isBrainstormerOpen} onClose={() => setIsBrainstormerOpen(false)} onSendToScriptGenerator={handleSendBrainstormToScript} onSendToProductGenerator={handleSendBrainstormToProduct} />
      <ProductGeneratorModal isOpen={isProductGeneratorOpen} onClose={() => setIsProductGeneratorOpen(false)} initialTitle={productInitialTitle} initialDescription={productInitialDescription} onAddToHistory={addToHistory} />
      <YouTubeToolsModal isOpen={isYouTubeToolsOpen} onClose={() => setIsYouTubeToolsOpen(false)} onAddToHistory={addToHistory} onSendToVoiceover={handleSendToVoiceover} onImportVisualsToMain={handleImportScript} onSendToThumbnail={handleSendToThumbnail} onSendToProduct={handleSendScriptToProduct} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onClearHistory={clearHistory} onRemoveItem={handleRemoveHistoryItem} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <main className="flex-grow overflow-y-auto pt-20">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
