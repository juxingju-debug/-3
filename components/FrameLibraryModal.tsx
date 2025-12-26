import React, { useRef } from 'react';
import Modal from './Modal';
import { FrameTemplate } from '../types';
import { TrashIcon, DownloadIcon, UploadIcon } from './Icons';

interface FrameLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    templates: FrameTemplate[];
    onSelect: (imageUrl: string) => void;
    onDelete: (id: string) => void;
    onExport: () => void;
    onImport: (file: File) => void;
}

const FrameLibraryModal: React.FC<FrameLibraryModalProps> = ({
    isOpen,
    onClose,
    templates,
    onSelect,
    onDelete,
    onExport,
    onImport,
}) => {
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImport(file);
        }
        // Reset input value to allow importing the same file again
        if(event.target) {
            event.target.value = '';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`画框素材库 (${templates.length}/50)`}>
            <div className="space-y-4">
                {templates.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <p className="font-semibold">素材库是空的</p>
                        <p className="text-sm mt-1">上传一个画框并点击 "保存到素材库" 来添加，或从备份文件导入。</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
                        {templates.map((template) => (
                            <div key={template.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                <img
                                    src={template.imageUrl}
                                    alt="Saved frame template"
                                    className="w-full h-full object-cover"
                                />
                                <div 
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                    onClick={() => onSelect(template.imageUrl)}
                                >
                                    <span className="text-white font-bold text-lg">选择</span>
                                </div>
                                <button
                                    onClick={() => onDelete(template.id)}
                                    className="absolute top-1 right-1 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500/80 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                                    aria-label="Delete template"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                 <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
                    <input
                        type="file"
                        ref={importInputRef}
                        className="hidden"
                        accept="application/json"
                        onChange={handleFileSelected}
                    />
                    <button
                        onClick={handleImportClick}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                        <UploadIcon className="w-4 h-4" />
                        <span>导入</span>
                    </button>
                    <button
                        onClick={onExport}
                        disabled={templates.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span>导出</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default React.memo(FrameLibraryModal);