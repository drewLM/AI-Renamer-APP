
import React, { useState, useEffect, useRef } from 'react';
import { TagIcon } from './icons';

interface KeywordAdderProps {
    imageKeywords: string[];
    userDefinedKeywords: string[];
    onAddKeywords: (keywords: string[]) => void;
}

export const KeywordAdder: React.FC<KeywordAdderProps> = ({ imageKeywords, userDefinedKeywords, onAddKeywords }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const availableKeywords = userDefinedKeywords.filter(
        k => !imageKeywords.includes(k)
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSelectedKeywords([]); 
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleCheckboxChange = (keyword: string) => {
        setSelectedKeywords(prev =>
            prev.includes(keyword)
                ? prev.filter(k => k !== keyword)
                : [...prev, keyword]
        );
    };

    const handleSubmit = () => {
        if (selectedKeywords.length > 0) {
            onAddKeywords(selectedKeywords);
        }
        setIsOpen(false);
        setSelectedKeywords([]);
    };

    if (userDefinedKeywords.length === 0) {
        return (
            <p className="text-sm text-gray-500 text-center">
                Define some keywords in the main view to add them here.
            </p>
        );
    }

    if (availableKeywords.length === 0) {
        return (
            <p className="text-sm text-gray-500 text-center">
                All of your defined keywords have been added.
            </p>
        );
    }
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center justify-center w-full px-4 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <TagIcon className="w-5 h-5 mr-2" />
                Add from your list
            </button>

            {isOpen && (
                <div className="absolute z-20 mt-2 w-full max-w-xs bg-gray-700 border border-gray-600 rounded-md shadow-lg bottom-full mb-2">
                     <div className="p-2 max-h-48 overflow-y-auto">
                        {availableKeywords.map(keyword => (
                            <label key={keyword} className="flex items-center space-x-3 px-2 py-2 rounded-md hover:bg-gray-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedKeywords.includes(keyword)}
                                    onChange={() => handleCheckboxChange(keyword)}
                                    className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-200">{keyword}</span>
                            </label>
                        ))}
                    </div>
                    <div className="p-2 border-t border-gray-600">
                        <button
                            onClick={handleSubmit}
                            disabled={selectedKeywords.length === 0}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-cyan-500"
                        >
                            Add ({selectedKeywords.length})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
