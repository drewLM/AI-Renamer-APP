
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import { ImageUploader } from './components/ImageUploader';
import { ImageItem } from './components/ImageItem';
import { generateImageDetails } from './services/geminiService';
import { SparklesIcon, DownloadIcon, DocumentTextIcon, TagIcon, CopyIcon, CheckIcon } from './components/icons';
import { TagEditorModal } from './components/KeywordModal';
import { GlobalKeywordAdder } from './components/GlobalKeywordAdder';

export interface ProcessedImage {
    id: string;
    file: File;
    imageUrl: string;
    originalExtension: string;
    suggestedName: string;
    isLoading: boolean;
    error: string | null;
    keywords: string[];
}

const App: React.FC = () => {
    const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
    const [wordLimit, setWordLimit] = useState<number>(10);
    const [userKeywords, setUserKeywords] = useState<string>('');
    const [isZipping, setIsZipping] = useState(false);
    const [editingImage, setEditingImage] = useState<ProcessedImage | null>(null);
    const [listCopied, setListCopied] = useState(false);

    const userKeywordList = useMemo(() => {
        return userKeywords.trim() ? userKeywords.split(',').map(k => k.trim()).filter(Boolean) : [];
    }, [userKeywords]);
    
    const successfulImages = useMemo(() => processedImages.filter(img => !!img.suggestedName), [processedImages]);
    
    const allUniqueKeywords = useMemo(() => {
        const imageKeywords = processedImages.flatMap(img => img.keywords);
        const all = [...userKeywordList, ...imageKeywords];
        return [...new Set(all)].sort();
    }, [processedImages, userKeywordList]);

    const renamedFilesList = useMemo(() => {
        return successfulImages.map(img => img.suggestedName).join(', ');
    }, [successfulImages]);


    const handleImageUpload = useCallback((files: File[]) => {
        const newImages: ProcessedImage[] = Array.from(files)
            .filter(file => file.type.startsWith('image/'))
            .map(file => {
                const fileExt = file.name.slice(file.name.lastIndexOf('.'));
                return {
                    id: `${file.name}-${file.lastModified}-${Math.random()}`,
                    file,
                    imageUrl: URL.createObjectURL(file),
                    originalExtension: fileExt,
                    suggestedName: '',
                    isLoading: false,
                    error: null,
                    keywords: [],
                };
            });
        
        if (newImages.length > 0) {
            setProcessedImages(prev => [...prev, ...newImages]);
        }
    }, []);

    const handleGenerateNameForImage = async (id: string) => {
        const imageToProcess = processedImages.find(img => img.id === id);
        if (!imageToProcess) return;

        setProcessedImages(prev => prev.map(img => 
            img.id === id ? { ...img, isLoading: true, error: null } : img
        ));

        try {
            const details = await generateImageDetails(imageToProcess.file, wordLimit, userKeywords);
            setProcessedImages(prev => prev.map(img => 
                img.id === id ? { ...img, suggestedName: details.filename, keywords: details.keywords.sort(), isLoading: false } : img
            ));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setProcessedImages(prev => prev.map(img => 
                img.id === id ? { ...img, isLoading: false, error: errorMessage } : img
            ));
        }
    };

    const handleGenerateAllNames = async () => {
        const imagesToProcess = processedImages.filter(image => !image.suggestedName && !image.isLoading);

        for (const image of imagesToProcess) {
            // The `handleGenerateNameForImage` function internally checks if the image still exists
            // before making an API call, which prevents errors if the user removes an image
            // during the batch process.
            await handleGenerateNameForImage(image.id);
            // Add a delay to avoid hitting API rate limits.
            await new Promise(resolve => setTimeout(resolve, 1100));
        }
    };
    
    const handleClearAll = () => {
        processedImages.forEach(image => URL.revokeObjectURL(image.imageUrl));
        setProcessedImages([]);
    };

    const handleRemoveImage = (id: string) => {
        const imageToRemove = processedImages.find(img => img.id === id);
        if(imageToRemove) {
            URL.revokeObjectURL(imageToRemove.imageUrl);
        }
        setProcessedImages(prev => prev.filter(img => img.id !== id));
    };
    
    const handleNameChange = (id: string, newName: string) => {
        setProcessedImages(prev => prev.map(img =>
            img.id === id ? { ...img, suggestedName: newName } : img
        ));
    };

    const handleWordLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.valueAsNumber;
        if (!isNaN(value) && value > 0) {
            setWordLimit(value);
        }
    };
    
    const handleAddKeywords = (id: string, keywordsToAdd: string[]) => {
        setProcessedImages(prev => prev.map(img => {
            if (img.id === id) {
                const newKeywords = keywordsToAdd.filter(k => !img.keywords.includes(k));
                if (newKeywords.length > 0) {
                    const updatedKeywords = [...img.keywords, ...newKeywords].sort();
                    return { ...img, keywords: updatedKeywords };
                }
            }
            return img;
        }));
    };

    const handleAddKeywordsToAll = (keywordsToAdd: string[]) => {
        if (keywordsToAdd.length === 0 || successfulImages.length === 0) return;

        if (!window.confirm(`Are you sure you want to add "${keywordsToAdd.join(', ')}" to ${successfulImages.length} renamed images? This action cannot be undone.`)) {
            return;
        }

        setProcessedImages(prev => prev.map(img => {
            // Only add keywords to images that have been successfully processed
            if (img.suggestedName) {
                const newKeywords = keywordsToAdd.filter(k => !img.keywords.includes(k));
                if (newKeywords.length > 0) {
                    const updatedKeywords = [...img.keywords, ...newKeywords].sort();
                    return { ...img, keywords: updatedKeywords };
                }
            }
            return img;
        }));
    };

    const handleRemoveKeyword = (id: string, keywordToRemove: string) => {
        setProcessedImages(prev => prev.map(img => {
            if (img.id === id) {
                const updatedKeywords = img.keywords.filter(k => k !== keywordToRemove);
                return { ...img, keywords: updatedKeywords };
            }
            return img;
        }));
    };

    const handleOpenTagEditor = (imageToEdit: ProcessedImage) => {
        setEditingImage(imageToEdit);
    };

    const handleCloseTagEditor = () => {
        setEditingImage(null);
    };


    const handleDownloadAll = async () => {
        if (successfulImages.length === 0) return;

        setIsZipping(true);
        try {
            const zip = new JSZip();
            successfulImages.forEach(image => {
                const newFilename = `${image.suggestedName}${image.originalExtension}`;
                zip.file(newFilename, image.file);
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `renamed-images-${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch(error) {
            console.error("Failed to create zip file:", error);
        } finally {
            setIsZipping(false);
        }
    };

    const handleDownloadCsv = () => {
        if (successfulImages.length === 0) return;

        const sortedData = [...successfulImages].sort((a, b) => 
            a.suggestedName.localeCompare(b.suggestedName)
        );

        const header = 'New File Name,Keywords\n';
        const rows = sortedData.map(image => {
            const newName = `"${image.suggestedName}${image.originalExtension}"`;
            const keywords = `"${image.keywords.join(', ')}"`;
            return `${newName},${keywords}`;
        });

        const csvContent = header + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `image_keywords_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyList = useCallback(() => {
        if (renamedFilesList) {
            navigator.clipboard.writeText(renamedFilesList);
            setListCopied(true);
        }
    }, [renamedFilesList]);

    useEffect(() => {
        if (listCopied) {
            const timer = setTimeout(() => setListCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [listCopied]);


    const imagesToProcessCount = processedImages.filter(img => !img.suggestedName && !img.isLoading).length;
    const successfulCount = successfulImages.length;
    const isProcessing = processedImages.some(img => img.isLoading);
    const imageBeingEdited = processedImages.find(img => img.id === editingImage?.id) ?? null;

    return (
        <>
            <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
                <div className="w-full max-w-7xl">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                            AI Image Renamer & Tagger
                        </h1>
                        <p className="mt-2 text-lg text-gray-400 max-w-2xl mx-auto">
                           Upload your images, define your keywords, and let AI generate descriptive filenames and tags in one click.
                        </p>
                    </header>

                    <main className="w-full">
                        <div className="max-w-3xl mx-auto">
                            <ImageUploader onImageUpload={handleImageUpload} />
                        </div>
                        
                        {processedImages.length > 0 && (
                            <div className="mt-8">
                                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                                     <label htmlFor="user-keywords" className="flex items-center text-lg font-medium text-gray-200 mb-2">
                                        <TagIcon className="w-5 h-5 mr-2" />
                                        Define Custom Keywords (Optional)
                                    </label>
                                    <textarea
                                        id="user-keywords"
                                        rows={2}
                                        value={userKeywords}
                                        onChange={(e) => setUserKeywords(e.target.value)}
                                        className="w-full bg-gray-900 border-gray-600 rounded-md shadow-sm p-3 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-200"
                                        placeholder="e.g., nature, beach, sunset, urban, portrait..."
                                    />
                                    <p className="text-sm text-gray-400 mt-2">
                                        Enter comma-separated keywords. The AI will select the most relevant tags for each image from this list. If left empty, AI will generate keywords automatically.
                                    </p>
                                </div>


                                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 flex-wrap">
                                    <h2 className="text-2xl font-semibold text-white">
                                        Image Queue ({processedImages.length})
                                    </h2>
                                    <div className="flex gap-4 items-center flex-wrap justify-center">
                                        <div className="flex items-center gap-2">
                                            <label htmlFor="word-limit" className="text-sm font-medium text-gray-300">Word Limit:</label>
                                            <input 
                                                type="number" 
                                                id="word-limit"
                                                value={wordLimit}
                                                onChange={handleWordLimitChange}
                                                min="1"
                                                max="20"
                                                className="w-20 bg-gray-800 border-gray-600 rounded-md shadow-sm pl-3 pr-1 py-1.5 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                             <button
                                                onClick={handleDownloadCsv}
                                                disabled={successfulCount === 0}
                                                className="flex items-center justify-center px-4 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
                                            >
                                                <DocumentTextIcon className="w-5 h-5 mr-2" />
                                                Download CSV
                                            </button>
                                            <button
                                                onClick={handleDownloadAll}
                                                disabled={successfulCount === 0 || isZipping}
                                                className="flex items-center justify-center px-4 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
                                            >
                                                <DownloadIcon className="w-5 h-5 mr-2" />
                                                {isZipping ? 'Zipping...' : `Download All (${successfulCount})`}
                                            </button>
                                            <button
                                                onClick={handleGenerateAllNames}
                                                disabled={imagesToProcessCount === 0 || isProcessing}
                                                className="flex items-center justify-center px-4 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
                                            >
                                                <SparklesIcon className="w-5 h-5 mr-2" />
                                                {isProcessing ? 'Processing...' : `Generate All (${imagesToProcessCount})`}
                                            </button>
                                            <button
                                                onClick={handleClearAll}
                                                className="px-5 py-2.5 border border-gray-600 text-base font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-colors"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {successfulCount > 0 && (
                                    <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <label htmlFor="renamed-files-list" className="flex items-center text-lg font-medium text-gray-200">
                                                <DocumentTextIcon className="w-5 h-5 mr-2" />
                                                Renamed Files List
                                            </label>
                                            <button
                                                onClick={handleCopyList}
                                                className="flex items-center gap-2 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
                                                aria-label="Copy list of filenames"
                                            >
                                                {listCopied ? (
                                                    <>
                                                        <CheckIcon className="w-4 h-4 text-green-300" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <CopyIcon className="w-4 h-4" />
                                                        Copy List
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <textarea
                                            id="renamed-files-list"
                                            readOnly
                                            value={renamedFilesList}
                                            className="w-full bg-gray-900 border-gray-600 rounded-md shadow-sm p-3 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-200 resize-none font-mono"
                                            rows={4}
                                            placeholder="No files have been renamed yet."
                                        />
                                        <p className="text-sm text-gray-400 mt-2">
                                            A comma-separated list of your new filenames (without extensions), ready to be copied.
                                        </p>
                                    </div>
                                )}

                                {successfulCount > 0 && allUniqueKeywords.length > 0 && (
                                    <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                                        <h3 className="text-lg font-medium text-gray-200 mb-3 flex items-center">
                                            <TagIcon className="w-5 h-5 mr-2" />
                                            Bulk Keyword Adder
                                        </h3>
                                        <GlobalKeywordAdder
                                            allKeywords={allUniqueKeywords}
                                            onAdd={handleAddKeywordsToAll}
                                            disabled={successfulCount === 0}
                                        />
                                        <p className="text-sm text-gray-400 mt-2 text-center">
                                            Quickly apply any existing keyword to all successfully renamed images.
                                        </p>
                                    </div>
                                )}


                                <div className="space-y-4">
                                    {processedImages.map((image) => (
                                        <ImageItem
                                            key={image.id}
                                            image={image}
                                            onNameChange={(newName) => handleNameChange(image.id, newName)}
                                            onRemove={() => handleRemoveImage(image.id)}
                                            onRetry={() => handleGenerateNameForImage(image.id)}
                                            onEditTags={() => handleOpenTagEditor(image)}
                                            onRemoveKeyword={(keyword) => handleRemoveKeyword(image.id, keyword)}
                                            isProcessing={isProcessing}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </main>
                    
                    <footer className="text-center mt-12 text-gray-500 text-sm">
                        <p>Powered by Google Gemini. Designed by a World-Class Senior Frontend Engineer.</p>
                    </footer>
                </div>
            </div>

            {imageBeingEdited && (
                <TagEditorModal
                    image={imageBeingEdited}
                    userDefinedKeywords={userKeywordList}
                    onClose={handleCloseTagEditor}
                    onAddKeywords={(keywords) => handleAddKeywords(imageBeingEdited.id, keywords)}
                    onRemoveKeyword={(keyword) => handleRemoveKeyword(imageBeingEdited.id, keyword)}
                />
            )}
        </>
    );
};

export default App;
