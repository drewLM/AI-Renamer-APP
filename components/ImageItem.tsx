
import React, { useState, useEffect } from 'react';
import type { ProcessedImage } from '../App';
import { CopyIcon, CheckIcon, XCircleIcon, RetryIcon, DownloadIcon, TagIcon, PencilIcon } from './icons';

interface ImageItemProps {
    image: ProcessedImage;
    onNameChange: (name: string) => void;
    onRemove: () => void;
    onRetry: () => void;
    onEditTags: () => void;
    onRemoveKeyword: (keyword: string) => void;
    isProcessing: boolean;
}

export const ImageItem: React.FC<ImageItemProps> = ({ 
    image, 
    onNameChange, 
    onRemove, 
    onRetry,
    onEditTags,
    onRemoveKeyword,
    isProcessing
}) => {
    const [copied, setCopied] = useState(false);
    const { id, imageUrl, file, isLoading, error, suggestedName, originalExtension, keywords } = image;

    const handleCopy = () => {
        if (suggestedName && originalExtension) {
            navigator.clipboard.writeText(`${suggestedName}${originalExtension}`);
            setCopied(true);
        }
    };

    const handleDownload = () => {
        if (!suggestedName || !originalExtension) return;

        const newFilename = `${suggestedName}${originalExtension}`;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = newFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const renderStatus = () => {
        if (isLoading) {
            return (
                <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-400">Generating...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-red-400">
                        <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                     <button
                        onClick={onRetry}
                        className="flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Retry generation"
                        disabled={isProcessing}
                    >
                        <RetryIcon className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            );
        }
        
        if (suggestedName) {
            return (
                <div className="w-full">
                    <div className="relative">
                        <input
                            id={`filename-input-${id}`}
                            type="text"
                            value={suggestedName}
                            onChange={(e) => onNameChange(e.target.value)}
                            className="block w-full bg-gray-900 border-gray-600 rounded-md shadow-sm pl-3 pr-28 py-2.5 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-200"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
                            <span className="text-gray-500 mr-2">{originalExtension}</span>
                            <button
                                onClick={handleDownload}
                                className="p-2 rounded-md text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors"
                                aria-label="Download renamed image"
                            >
                                <DownloadIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleCopy}
                                className="p-2 rounded-md text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors"
                                aria-label="Copy filename"
                            >
                                {copied ? (
                                    <CheckIcon className="w-5 h-5 text-green-400" />
                                ) : (
                                    <CopyIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return <div className="text-gray-500">Waiting for generation...</div>;
    };

    return (
        <div className="bg-gray-800/50 rounded-lg p-4 flex items-start sm:items-center gap-4 w-full flex-col sm:flex-row">
            <div className="flex-shrink-0">
                <img 
                    src={imageUrl} 
                    alt={file.name} 
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-md bg-gray-950"
                />
            </div>
            <div className="flex-grow min-w-0 w-full">
                <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-300 truncate pr-2" title={file.name}>
                        {file.name}
                    </p>
                    <button
                        onClick={onRemove}
                        className="p-1 -mr-1 -mt-1 text-gray-500 hover:text-white transition-colors flex-shrink-0"
                        aria-label="Remove image"
                    >
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="mt-3">
                    {renderStatus()}
                </div>
                {suggestedName && (
                    <div className="mt-2 group">
                        <div className="flex flex-wrap gap-x-2 gap-y-1 items-center w-full text-left p-2 -ml-2">
                            <TagIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            {keywords.length > 0 ? (
                                keywords.map(keyword => (
                                    <span key={keyword} className="flex items-center bg-gray-700 text-gray-300 text-xs font-medium pl-2.5 pr-1 py-1 rounded-full transition-all duration-200 ease-in-out">
                                        {keyword}
                                        <button 
                                            onClick={() => onRemoveKeyword(keyword)}
                                            className="ml-1.5 p-0.5 rounded-full text-gray-400 hover:bg-red-500/75 hover:text-white transition-colors"
                                            aria-label={`Remove ${keyword} tag`}
                                        >
                                            <XCircleIcon className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500 italic">No keywords assigned.</span>
                            )}
                            <button 
                                onClick={onEditTags}
                                className="p-1 rounded-full text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-gray-700/50 hover:text-white focus:opacity-100 transition-opacity ml-auto"
                                aria-label="Edit tags in modal"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
