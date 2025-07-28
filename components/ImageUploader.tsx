
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
    onImageUpload: (files: File[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onImageUpload(Array.from(e.target.files));
            // Reset file input to allow uploading the same file(s) again
            e.target.value = '';
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onImageUpload(Array.from(e.dataTransfer.files));
        }
    }, [onImageUpload]);

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };
    
    return (
        <div
            onDrop={handleDrop}
            onDragEnter={handleDragEvents}
            onDragOver={handleDragEvents}
            onDragLeave={handleDragEvents}
            className={`relative w-full aspect-video md:aspect-[2/1] lg:aspect-[3/1] border-2 border-dashed rounded-lg flex flex-col justify-center items-center text-center p-4 cursor-pointer transition-colors
                ${isDragging ? 'border-cyan-500 bg-gray-800' : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}`}
        >
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Image uploader"
            />
            <div className="flex flex-col items-center text-gray-400 pointer-events-none">
                <UploadIcon className="w-12 h-12 mb-2" />
                <p className="font-semibold text-gray-300">Click to upload or drag & drop</p>
                <p className="text-sm">PNG, JPG, GIF, WEBP</p>
            </div>
        </div>
    );
};
