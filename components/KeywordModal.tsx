
import React from 'react';
import type { ProcessedImage } from '../App';
import { XCircleIcon, TagIcon } from './icons';
import { KeywordAdder } from './KeywordAdder';

interface TagEditorModalProps {
    image: ProcessedImage;
    userDefinedKeywords: string[];
    onClose: () => void;
    onAddKeywords: (keywords: string[]) => void;
    onRemoveKeyword: (keyword: string) => void;
}

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
    image,
    userDefinedKeywords,
    onClose,
    onAddKeywords,
    onRemoveKeyword
}) => {
    // Stop body scroll when modal is open
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 transition-opacity duration-300"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-full max-h-[85vh] flex flex-col md:flex-row overflow-hidden transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image Preview Section */}
                <div className="w-full md:w-2/3 bg-gray-900 flex items-center justify-center p-4 relative">
                    <img
                        src={image.imageUrl}
                        alt={`Preview of ${image.file.name}`}
                        className="max-w-full max-h-full object-contain rounded-lg"
                    />
                     <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full hover:bg-black/75 transition-colors md:hidden">
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </div>
                
                {/* Editing Section */}
                <div className="w-full md:w-1/3 flex flex-col p-6 bg-gray-800">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-white pr-4">Edit Tags</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors hidden md:block">
                            <XCircleIcon className="w-8 h-8" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-400 mb-6 truncate" title={image.file.name}>
                        Editing: <span className="font-medium text-gray-300">{image.file.name}</span>
                    </p>

                    <div className="flex-grow overflow-y-auto pr-2 -mr-3 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                            <TagIcon className="w-5 h-5 mr-2" />
                            Assigned Keywords
                        </h3>
                        <div className="flex flex-wrap gap-2 items-center">
                            {image.keywords.length > 0 ? (
                                image.keywords.map(keyword => (
                                    <span key={keyword} className="flex items-center bg-gray-700 text-gray-300 text-sm font-medium pl-3 pr-1 py-1 rounded-full animate-fade-in-scale-fast">
                                        {keyword}
                                        <button 
                                            onClick={() => onRemoveKeyword(keyword)} 
                                            className="ml-1.5 -mr-0.5 p-0.5 rounded-full hover:bg-gray-600 focus:outline-none focus:bg-gray-600 transition-colors"
                                            aria-label={`Remove ${keyword} tag`}
                                        >
                                            <XCircleIcon className="w-4 h-4" />
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No keywords assigned yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700 mt-4">
                        <KeywordAdder
                            imageKeywords={image.keywords}
                            userDefinedKeywords={userDefinedKeywords}
                            onAddKeywords={onAddKeywords}
                        />
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes fade-in-scale-fast {
                    0% { opacity: 0; transform: scale(0.9); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale-fast { animation: fade-in-scale-fast 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};
