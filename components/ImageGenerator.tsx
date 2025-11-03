import React, { useState, useRef } from 'react';
import { generateImage, generateStoryboardScene } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Spinner } from './ui/Spinner';
import { SparklesIcon, ErrorIcon, DownloadIcon, FilmIcon, TrashIcon, UserCircleIcon, PencilIcon } from './icons/Icons';

type AspectRatio = '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
type Mode = 'single' | 'storyboard';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [storyboardPrompts, setStoryboardPrompts] = useState<string[]>(['']);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('single');
  
  const [characterImages, setCharacterImages] = useState<(File | null)[]>([null, null]);
  const [characterImageUrls, setCharacterImageUrls] = useState<(string | null)[]>([null, null]);
  const characterFileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleCharacterFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (characterImageUrls[index]) {
        URL.revokeObjectURL(characterImageUrls[index]!);
      }
      const newImages = [...characterImages];
      newImages[index] = file;
      setCharacterImages(newImages);

      const newUrls = [...characterImageUrls];
      newUrls[index] = URL.createObjectURL(file);
      setCharacterImageUrls(newUrls);
    }
  };

  const handleRemoveCharacterImage = (index: number) => {
    if (characterImageUrls[index]) {
      URL.revokeObjectURL(characterImageUrls[index]!);
    }
    const newImages = [...characterImages];
    newImages[index] = null;
    setCharacterImages(newImages);

    const newUrls = [...characterImageUrls];
    newUrls[index] = null;
    setCharacterImageUrls(newUrls);
  };

  const handleStoryboardPromptChange = (index: number, value: string) => {
    const newPrompts = [...storyboardPrompts];
    newPrompts[index] = value;
    setStoryboardPrompts(newPrompts);
  };

  const handleAddScene = () => {
    setStoryboardPrompts([...storyboardPrompts, '']);
  };

  const handleRemoveScene = (index: number) => {
    if (storyboardPrompts.length > 1) {
      const newPrompts = storyboardPrompts.filter((_, i) => i !== index);
      setStoryboardPrompts(newPrompts);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImages(null);

    try {
      if (mode === 'single') {
        if (!prompt) {
          setError('Please enter a prompt.');
          setIsLoading(false);
          return;
        }
        const imageUrls = await generateImage(prompt, aspectRatio);
        setGeneratedImages(imageUrls);
      } else {
        const validPrompts = storyboardPrompts.filter(p => p.trim() !== '');
        if (validPrompts.length === 0) {
          setError('Please enter a prompt for at least one scene.');
          setIsLoading(false);
          return;
        }

        const characterImageParts: { data: string, mimeType: string }[] = [];
        for (let i = 0; i < characterImages.length; i++) {
            const file = characterImages[i];
            if (file) {
                const base64 = await fileToBase64(file);
                characterImageParts.push({ data: base64, mimeType: file.type });
            }
        }

        const imagePromises = validPrompts.map(p => generateStoryboardScene(p, aspectRatio, characterImageParts));
        const imageUrls = await Promise.all(imagePromises);
        setGeneratedImages(imageUrls);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (imageUrl: string, index: number) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    
    const filenamePrompt = mode === 'single' ? prompt : storyboardPrompts[index] || 'storyboard_scene';
    const filename = filenamePrompt
      .substring(0, 50)
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_') || 'generated_image';
      
    const suffix = mode === 'single' ? `_${index + 1}` : `_scene_${index + 1}`;
    link.download = `${filename}${suffix}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const aspectRatioOptions: { value: AspectRatio; label: string }[] = [
      { value: '16:9', label: 'Widescreen (16:9)' },
      { value: '9:16', label: 'Portrait (9:16)' },
      { value: '1:1', label: 'Square (1:1)' },
      { value: '4:3', label: 'Standard (4:3)' },
      { value: '3:4', label: 'Tall (3:4)' },
  ];

  const isGenerateDisabled = isLoading || 
    (mode === 'single' && !prompt.trim()) || 
    (mode === 'storyboard' && storyboardPrompts.every(p => !p.trim()));

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <div className="p-6">
          <div className="flex border-b border-gray-700 mb-6">
            <button
              onClick={() => setMode('single')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                  mode === 'single' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <SparklesIcon /> Single Image
            </button>
            <button
              onClick={() => setMode('storyboard')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                  mode === 'storyboard' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <FilmIcon /> Storyboard
            </button>
          </div>
          
          {mode === 'single' ? (
            <div>
              <p className="text-gray-400 mb-6">Describe the image you want to create. Be as specific or as imaginative as you like.</p>
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A cinematic shot of a lone astronaut on a neon-lit alien planet"
                className="w-full"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400 mb-2">Describe each scene of your story. The selected aspect ratio will be applied to all scenes.</p>

               <div className="border-y border-gray-700 py-6 my-6">
                  <h3 className="text-lg font-medium text-white mb-1">Consistent Characters (Optional)</h3>
                  <p className="text-sm text-gray-400 mb-4">Upload up to 2 character reference images to maintain consistency across scenes.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[0, 1].map(index => (
                          <div key={index}>
                              <label className="text-sm font-medium text-gray-300 mb-2 block">Character {index + 1}</label>
                              <div className={`w-full aspect-square rounded-lg flex items-center justify-center relative overflow-hidden transition-colors ${
                                  characterImageUrls[index] ? 'bg-gray-900' : 'bg-gray-700/50 border-2 border-dashed border-gray-600 hover:border-indigo-500'
                              }`}>
                                  <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleCharacterFileChange(index, e)}
                                      className="hidden"
                                      ref={characterFileInputRefs[index]}
                                      disabled={isLoading}
                                  />
                                  {characterImageUrls[index] ? (
                                      <>
                                          <img src={characterImageUrls[index]} alt={`Character ${index + 1}`} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                              <Button
                                                  onClick={() => characterFileInputRefs[index].current?.click()}
                                                  variant="secondary"
                                                  aria-label="Change Character Image"
                                                  disabled={isLoading}
                                              >
                                                  <PencilIcon /> Change
                                              </Button>
                                              <Button
                                                  onClick={() => handleRemoveCharacterImage(index)}
                                                  className="!bg-red-600 hover:!bg-red-700 focus:!ring-red-500"
                                                  aria-label="Remove Character Image"
                                                  disabled={isLoading}
                                              >
                                                  <TrashIcon /> Remove
                                              </Button>
                                          </div>
                                      </>
                                  ) : (
                                      <button
                                          onClick={() => characterFileInputRefs[index].current?.click()}
                                          className="flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors w-full h-full"
                                          disabled={isLoading}
                                          aria-label={`Upload Character ${index + 1}`}
                                      >
                                          <UserCircleIcon />
                                          <span className="text-sm mt-1 font-medium">Upload Image</span>
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {storyboardPrompts.map((p, index) => (
                <div key={index} className="flex items-center gap-3">
                  <label htmlFor={`scene-${index}`} className="text-sm font-medium text-gray-400 whitespace-nowrap">Scene {index + 1}</label>
                  <Input
                    id={`scene-${index}`}
                    value={p}
                    onChange={(e) => handleStoryboardPromptChange(index, e.target.value)}
                    placeholder="e.g., A hero discovers a mysterious glowing orb"
                    className="flex-grow"
                    disabled={isLoading}
                  />
                  {storyboardPrompts.length > 1 && (
                    <button
                      onClick={() => handleRemoveScene(index)}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-700 transition-colors"
                      aria-label={`Remove Scene ${index + 1}`}
                      disabled={isLoading}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              ))}
              <div className="pt-2">
                <Button onClick={handleAddScene} variant="secondary" disabled={isLoading}>
                  Add Scene
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
             <div className="flex-grow" />
             <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-auto p-2.5"
                disabled={isLoading}
            >
                {aspectRatioOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <Button onClick={handleGenerate} disabled={isGenerateDisabled}>
              {isLoading ? <Spinner /> : 'Generate'}
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="bg-red-900/20 border-red-500">
            <div className="p-4 flex items-center gap-3">
                <ErrorIcon />
                <p className="text-red-300">{error}</p>
            </div>
        </Card>
      )}

      {isLoading && (
         <Card>
            <div className="p-6 flex flex-col items-center justify-center min-h-[36rem]">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-400">{mode === 'single' ? 'Your vision is materializing...' : 'Bringing your story to life, scene by scene...'}</p>
                <p className="mt-2 text-sm text-gray-500">{mode === 'single' ? 'Generating four unique options for you.' : 'This may take a few moments.'}</p>
            </div>
        </Card>
      )}

      {generatedImages && (
        <Card>
            <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Results</h3>
                 <div className={`grid grid-cols-1 sm:grid-cols-2 ${mode === 'storyboard' ? 'lg:grid-cols-3' : ''} gap-4`}>
                    {generatedImages.map((image, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden shadow-lg">
                            {mode === 'storyboard' && <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">Scene {index + 1}</div>}
                            <img src={image} alt={`Generated ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center">
                                <Button
                                    onClick={() => handleDownload(image, index)}
                                    variant="secondary"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-100 scale-95"
                                >
                                    <DownloadIcon />
                                    Download
                                </Button>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </Card>
      )}
    </div>
  );
};

export default ImageGenerator;