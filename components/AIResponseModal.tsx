
import React from 'react';
import { X } from 'lucide-react';

interface AIResponseModalProps {
    title: string;
    content: string;
    onClose: () => void;
}

const AIResponseModal: React.FC<AIResponseModalProps> = ({ title, content, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[70]" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="overflow-y-auto flex-grow pr-2">
                    <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-md font-sans">{content}</pre>
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t">
                     <button
                        onClick={() => {
                            navigator.clipboard.writeText(content);
                            alert('Content copied to clipboard!');
                        }}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 mr-2"
                    >
                        Copy Text
                    </button>
                    <button onClick={onClose} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIResponseModal;
