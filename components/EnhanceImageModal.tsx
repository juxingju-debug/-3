import React, { useState } from 'react';
import Modal from './Modal';
import { LoadingSpinner, SparklesIcon, XMarkIcon, StarIcon } from './Icons';
import { GeneratedImage } from '../types';

interface EnhanceImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    image: GeneratedImage | null;
    onEnhance: (image: GeneratedImage, type: 'upscale' | 'sharpen') => Promise<string | null>;
    onAccept: (originalImageId: string, newImageUrl: string) => void;
}

const EnhanceImageModal: React.FC<EnhanceImageModalProps> = ({ isOpen, onClose, image, onEnhance, onAccept }) => {
    const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        setEnhancedImageUrl(null);
        setIsEnhancing(false);
        setError(null);
        onClose();
    };

    const handleEnhance = async (type: 'upscale' | 'sharpen') => {
        if (!image) return;
        setIsEnhancing(true);
        setError(null);
        setEnhancedImageUrl(null);
        try {
            const newUrl = await onEnhance(image, type);
            if (newUrl) {
                setEnhancedImageUrl(newUrl);
            } else {
                throw new Error("Enhancement did not return an image.");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to enhance image.');
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleAccept = () => {
        if (image && enhancedImageUrl) {
            onAccept(image.id, enhancedImageUrl);
            handleClose();
        }
    };

    const handleRetry = () => {
        setEnhancedImageUrl(null);
        setError(null);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="增强图片质量">
            {image && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="text-center">
                            <p className="font-semibold mb-2 text-slate-700 dark:text-slate-300">原始图片</p>
                            <img src={image.imageUrl} alt="Original" className="w-full h-auto rounded-lg object-contain max-h-[40vh]" />
                        </div>
                        <div className="text-center relative">
                            <p className="font-semibold mb-2 text-slate-700 dark:text-slate-300">增强后</p>
                            <div className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                {isEnhancing ? (
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <LoadingSpinner className="w-8 h-8 text-brand-light" />
                                        <span>正在增强...</span>
                                    </div>
                                ) : enhancedImageUrl ? (
                                    <img src={enhancedImageUrl} alt="Enhanced" className="w-full h-auto rounded-lg object-contain max-h-[40vh]" />
                                ) : (
                                    <div className="text-slate-400">增强后的图片将显示在这里</div>
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
                    
                    {!enhancedImageUrl && !isEnhancing && (
                        <div className="flex justify-center gap-4 pt-4">
                           <button onClick={() => handleEnhance('upscale')} disabled={isEnhancing} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                               <SparklesIcon className="w-5 h-5"/>
                               <span>提升画质 (2x)</span>
                           </button>
                           <button onClick={() => handleEnhance('sharpen')} disabled={isEnhancing} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                               <StarIcon className="w-5 h-5"/>
                               <span>锐化细节</span>
                           </button>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        {enhancedImageUrl ? (
                            <>
                                <button onClick={handleRetry} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500 transition-colors">重试</button>
                                <button onClick={handleAccept} className="px-4 py-2 bg-brand-light text-white rounded-lg hover:bg-opacity-90 dark:bg-brand-dark dark:text-slate-900 transition-colors">保存更改</button>
                            </>
                        ) : (
                            <button onClick={handleClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500 transition-colors">取消</button>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default React.memo(EnhanceImageModal);