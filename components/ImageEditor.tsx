import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Spinner } from './ui/Spinner';
import { PencilIcon, UploadIcon, ErrorIcon, DownloadIcon, TrashIcon } from './icons/Icons';

type AspectRatio = 'original' | '1:1' | '9:16' | '16:9' | '4:3' | '3:4';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');
  const [originalImage, setOriginalImage] = useState<{ file: File; url: string } | null>(null);
  const [referenceImage, setReferenceImage] = useState<{ file: File; url: string } | null>(null);
  const [editedImages, setEditedImages] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (originalImage) {
        URL.revokeObjectURL(originalImage.url);
      }
      setOriginalImage({ file, url: URL.createObjectURL(file) });
      setEditedImages(null);
      setError(null);
    }
  };
  
  const handleRemoveOriginalImage = () => {
    if (originalImage) {
        URL.revokeObjectURL(originalImage.url);
        setOriginalImage(null);
    }
  };

  const handleReferenceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (referenceImage) {
            URL.revokeObjectURL(referenceImage.url);
        }
        setReferenceImage({ file, url: URL.createObjectURL(file) });
    }
  };

  const handleRemoveReferenceImage = () => {
    if (referenceImage) {
        URL.revokeObjectURL(referenceImage.url);
        setReferenceImage(null);
    }
  };


  const handleEdit = async () => {
    if (!prompt || !originalImage) {
      setError('Please upload an image and provide an editing prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImages(null);

    let finalPrompt = prompt;
    if (aspectRatio !== 'original') {
      finalPrompt = `${prompt}. Change the aspect ratio of the image to ${aspectRatio}.`;
    }

    try {
      const imageBase64 = await fileToBase64(originalImage.file);
      let referenceImagePart;
      if (referenceImage) {
          const refBase64 = await fileToBase64(referenceImage.file);
          referenceImagePart = { data: refBase64, mimeType: referenceImage.file.type };
      }
      const imageUrls = await editImage(finalPrompt, imageBase64, originalImage.file.type, referenceImagePart);
      setEditedImages(imageUrls);
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
    const originalName = originalImage?.file.name.split('.')[0] || 'edited_image';
    const promptPart = prompt
        .substring(0, 30)
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
    link.download = `${originalName}_${promptPart || 'edited'}_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const aspectRatioOptions: { value: AspectRatio; label: string }[] = [
    { value: 'original', label: 'Original Ratio' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '1:1', label: 'Square (1:1)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Tall (3:4)' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
            <PencilIcon /> Transform Your Image
          </h2>
          <p className="text-gray-400 mb-6">
            Upload an image and describe the changes. Provide an optional style reference for more consistent results (e.g., matching color palettes or artistic styles).
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Main Image Upload */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Image to Edit</label>
              <div className={`w-full aspect-video bg-gray-700/50 rounded-lg flex items-center justify-center relative overflow-hidden transition-colors ${
                  !originalImage && 'border-2 border-dashed border-gray-600 hover:border-indigo-500'
              }`}>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} disabled={isLoading} />
                {originalImage ? (
                  <>
                    <img src={originalImage.url} alt="Image to edit" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button onClick={() => fileInputRef.current?.click()} variant="secondary" aria-label="Change Image" disabled={isLoading}><PencilIcon /> Change</Button>
                      <Button onClick={handleRemoveOriginalImage} className="!bg-red-600 hover:!bg-red-700 focus:!ring-red-500" aria-label="Remove Image" disabled={isLoading}><TrashIcon /> Remove</Button>
                    </div>
                  </>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors w-full h-full" disabled={isLoading} aria-label="Upload Image to Edit">
                    <UploadIcon />
                    <span className="text-sm mt-1 font-medium">Upload Image</span>
                  </button>
                )}
              </div>
            </div>
            {/* Style Reference Upload */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Style Reference (Optional)</label>
               <div className={`w-full aspect-video bg-gray-700/50 rounded-lg flex items-center justify-center relative overflow-hidden transition-colors ${
                  !referenceImage && 'border-2 border-dashed border-gray-600 hover:border-indigo-500'
              }`}>
                <input type="file" accept="image/*" onChange={handleReferenceFileChange} className="hidden" ref={referenceFileInputRef} disabled={isLoading} />
                {referenceImage ? (
                  <>
                    <img src={referenceImage.url} alt="Style reference" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button onClick={() => referenceFileInputRef.current?.click()} variant="secondary" aria-label="Change Reference" disabled={isLoading}><PencilIcon /> Change</Button>
                      <Button onClick={handleRemoveReferenceImage} className="!bg-red-600 hover:!bg-red-700 focus:!ring-red-500" aria-label="Remove Reference" disabled={isLoading}><TrashIcon /> Remove</Button>
                    </div>
                  </>
                ) : (
                  <button onClick={() => referenceFileInputRef.current?.click()} className="flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors w-full h-full" disabled={isLoading} aria-label="Upload Style Reference">
                    <UploadIcon />
                    <span className="text-sm mt-1 font-medium">Upload Image</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Add a retro filter, make this look like a realistic HD photo"
              className="flex-grow"
              disabled={isLoading || !originalImage}
            />
            <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-auto p-2.5"
                disabled={isLoading || !originalImage}
            >
                {aspectRatioOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <Button onClick={handleEdit} disabled={isLoading || !prompt || !originalImage}>
              {isLoading ? <Spinner /> : 'Apply Edits'}
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

      {(isLoading || editedImages) && (
        <Card>
            <div className="p-6">
                 <h3 className="text-xl font-semibold text-white mb-4">Edited Results</h3>
                 {isLoading ? (
                     <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                         <Spinner size="lg" />
                         <p className="mt-4 text-gray-400">Applying your creative vision...</p>
                         <p className="mt-2 text-sm text-gray-500">Generating four unique options for you.</p>
                     </div>
                 ) : editedImages ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {editedImages.map((image, index) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden shadow-lg">
                                <img src={image} alt={`Edited version ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
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
                 ) : (
                    <div className="flex items-center justify-center h-full min-h-[300px] bg-gray-800/50 rounded-lg">
                        <p className="text-gray-400">Your edited images will appear here.</p>
                    </div>
                 )}
            </div>
        </Card>
      )}
    </div>
  );
};

export default ImageEditor;