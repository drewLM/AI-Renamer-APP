
import React, { useState, useEffect, useRef } from 'react';
import { TagIcon } from './icons';

interface GlobalKeywordAdderProps {
    allKeywords: string[];
    onAdd: (keywords: string[]) => void;
    disabled?: boolean;
}

export const GlobalKeywordAdder: React.FC<GlobalKeywordAdderProps> = ({ allKeywords, onAdd, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
            onAdd(selectedKeywords);
        }
        setIsOpen(false);
        setSelectedKeywords([]);
    };
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                disabled={disabled}
                className="flex items-center justify-center w-full px-4 py-2.5 border border-gray-600 text-base font-medium rounded-md text-gray-200 bg-gray-700/50 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <TagIcon className="w-5 h-5 mr-2" />
                Add Keywords to All...
            </button>

            {isOpen && (
                <div className="absolute z-30 mt-2 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg">
                     <div className="p-2 max-h-60 overflow-y-auto">
                        {allKeywords.map(keyword => (
                            <label key={keyword} className="flex items-center space-x-3 px-3 py-2.5 rounded-md hover:bg-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedKeywords.includes(keyword)}
                                    onChange={() => handleCheckboxChange(keyword)}
                                    className="h-4 w-4 rounded bg-gray-900 border-gray-500 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-200">{keyword}</span>
                            </label>
                        ))}
                    </div>
                    <div className="p-2 border-t border-gray-600 bg-gray-800/50">
                        <button
                            onClick={handleSubmit}
                            disabled={selectedKeywords.length === 0}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                        >
                            Add ({selectedKeywords.length}) to All
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
