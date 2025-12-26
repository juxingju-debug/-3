import React, { useState } from 'react';
import Modal from './Modal';
import { LoadingSpinner, SparklesIcon, XMarkIcon } from './Icons';
import { GeneratedImage } from '../types';

interface ModifyImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    image: GeneratedImage | null;
    onModify: (image: GeneratedImage, modificationPrompt: string) => Promise<string | null>;
    onAccept: (originalImageId: string, newImageUrl: string) => void;
}

const ModifyImageModal: React.FC<ModifyImageModalProps> = ({ isOpen, onClose, image, onModify, onAccept }) => {
    const [modificationPrompt, setModificationPrompt] = useState('');
    const [modifiedImageUrl, setModifiedImageUrl] = useState<string | null>(null);
    const [isModifying, setIsModifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        setModificationPrompt('');
        setModifiedImageUrl(null);
        setIsModifying(false);
        setError(null);
        onClose();
    };

    const handleModify = async () => {
        if (!image || !modificationPrompt.trim()) return;
        setIsModifying(true);
        setError(null);
        setModifiedImageUrl(null);
        try {
            const newUrl = await onModify(image, modificationPrompt);
            if (newUrl) {
                setModifiedImageUrl(newUrl);
            } else {
                throw new Error("修改未能返回图片。");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : '修改图片失败。');
        } finally {
            setIsModifying(false);
        }
    };

    const handleAccept = () => {
        if (image && modifiedImageUrl) {
            onAccept(image.id, modifiedImageUrl);
            handleClose();
        }
    };

    const handleRetry = () => {
        setModifiedImageUrl(null);
        setError(null);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="修改图片">
            {image && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="text-center">
                            <p className="font-semibold mb-2">原始图片</p>
                            <img src={image.imageUrl} alt="Original" className="w-full h-auto rounded-lg object-contain max-h-[40vh]" />
                        </div>
                        <div className="text-center relative">
                            <p className="font-semibold mb-2">修改后</p>
                            <div className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                {isModifying ? (
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <LoadingSpinner className="w-8 h-8 text-brand-light" />
                                        <span>正在修改...</span>
                                    </div>
                                ) : modifiedImageUrl ? (
                                    <img src={modifiedImageUrl} alt="Modified" className="w-full h-auto rounded-lg object-contain max-h-[40vh]" />
                                ) : (
                                    <div className="text-slate-400">修改后的图片将显示在这里</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {error && (
                         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                                <XMarkIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    )}
                    
                    {!modifiedImageUrl && !isModifying && (
                        <div>
                            <label htmlFor="modification-prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">修改指令</label>
                            <textarea
                                id="modification-prompt"
                                rows={2}
                                value={modificationPrompt}
                                onChange={e => setModificationPrompt(e.target.value)}
                                placeholder="例如：把背景换成星空"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-brand-light"
                            />
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        {modifiedImageUrl ? (
                            <>
                                <button onClick={handleRetry} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500 transition-colors">重试</button>
                                <button onClick={handleAccept} className="px-4 py-2 bg-brand-light text-white rounded-lg hover:bg-opacity-90 dark:bg-brand-dark dark:text-slate-900 transition-colors">保存更改</button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500 transition-colors">取消</button>
                                <button onClick={handleModify} disabled={!modificationPrompt.trim() || isModifying} className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-light text-white rounded-lg hover:bg-opacity-90 dark:bg-brand-dark dark:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isModifying ? <LoadingSpinner className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5" />}
                                    <span>应用修改</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default React.memo(ModifyImageModal);
