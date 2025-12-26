
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { GenerationParams, BackgroundOption, StyleOption, GenerationMode, ButtonMaterialOption, FrameShapeStrategy } from '../types';
import { LoadingSpinner, UploadIcon, SparklesIcon, FolderIcon, BookmarkIcon, XMarkIcon, CropIcon, EraserIcon, EyeIcon, RefreshIcon } from './Icons';
import { translateBackgroundOption, translateStyleOption, translateButtonMaterialOption, translateFrameShapeStrategy } from '../utils/translations';

interface ControlPanelProps {
    originalImages: File[];
    setOriginalImages: (files: File[] | ((prev: File[]) => File[])) => void;
    genParams: GenerationParams;
    setGenParams: React.Dispatch<React.SetStateAction<GenerationParams>>;
    count: number;
    setCount: (count: number) => void;
    onGenerate: () => void;
    isLoading: boolean;
    onOpenLibrary: () => void;
    onAddTemplate: () => Promise<void>;
    isLibraryFull: boolean;
    onCrop: (index: number, uploader: string) => void;
    generationMode: GenerationMode;
    setGenerationMode: (mode: GenerationMode) => void;
    onGenerateBackground: () => void;
    isGeneratingBackground: boolean;
    onGenerateProps: () => void;
    isGeneratingProps: boolean;
    onGeneratePropsForTheme: () => void;
    isGeneratingThemeProps: boolean;
    onGenerateElements: () => void;
    isGeneratingElements: boolean;
    onExpandTheme: (themeOverride?: string) => void;
    isExpandingTheme: boolean;
    onRemoveText: () => void;
    isRemovingText: boolean;
    fontSourceImage: File[];
    setFontSourceImage: (files: File[] | ((prev: File[]) => File[])) => void;
    fontStyleSourceImage: File[];
    setFontStyleSourceImage: (files: File[] | ((prev: File[]) => File[])) => void;
    frameStyleSourceImage: File[];
    setFrameStyleSourceImage: (files: File[] | ((prev: File[]) => File[])) => void;
    buttonStyleSourceImage: File[];
    setButtonStyleSourceImage: (files: File[] | ((prev: File[]) => File[])) => void;
    onResetContext: () => void;
    // Added for drag capability
    onHeaderMouseDown?: (e: React.MouseEvent) => void;
}

const NodeHeader: React.FC<{ number: string; title: string; colorClass: string; onMouseDown?: (e: React.MouseEvent) => void }> = ({ number, title, colorClass, onMouseDown }) => (
    <div 
        className={`relative h-2 w-full rounded-t-2xl ${colorClass} overflow-hidden cursor-grab active:cursor-grabbing`}
        onMouseDown={onMouseDown}
    >
        <div className="absolute inset-0 bg-white/20 pointer-events-none"></div>
    </div>
);

const ConnectionPort: React.FC<{ position: 'left' | 'right'; active?: boolean }> = ({ position, active }) => (
    <div className={`absolute top-[34px] -translate-y-1/2 w-4 h-4 rounded-full border-[3px] border-slate-100 dark:border-slate-800 z-20 
        ${position === 'left' ? '-left-2' : '-right-2'}
        ${active ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}
        transition-all duration-300
    `} />
);


const ImageUploader: React.FC<{
    images: File[];
    setImages: (files: File[] | ((prev: File[]) => File[])) => void;
    onCrop: (index: number, uploader: string) => void;
    uploaderId: string;
    mode: GenerationMode;
    elementMode?: GenerationParams['elementMode'];
}> = React.memo(({ images, setImages, onCrop, uploaderId, mode, elementMode }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const isSingleImageMode = mode === GenerationMode.FRAME || mode === GenerationMode.BACKGROUND || (mode === GenerationMode.ELEMENT && (elementMode === 'button' || elementMode === 'background')) || mode === GenerationMode.FONT;

    const isHoveringRef = useRef(false);

    useEffect(() => {
        const objectUrls = images.map(file => URL.createObjectURL(file));
        setPreviewUrls(objectUrls);
        return () => objectUrls.forEach(url => URL.revokeObjectURL(url));
    }, [images]);

    const handleFileChange = useCallback((files: FileList | null | File[]) => {
        if (!files || files.length === 0) return;
        const fileArray = Array.from(files);

        if (isSingleImageMode) {
            setImages([fileArray[0]]);
        } else { 
            setImages(prev => [...prev, ...fileArray].slice(0, 5));
        }
    }, [setImages, isSingleImageMode]);

    const handleRemoveImage = (indexToRemove: number) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };
    
    const handleCropImage = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        onCrop(index, uploaderId);
    };

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            if (!isHoveringRef.current) return;

            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

            const items = event.clipboardData?.items;
            if (!items) return;

            const imageFiles = Array.from(items)
                .filter(item => item.type.startsWith('image/'))
                .map(item => item.getAsFile())
                .filter((file): file is File => file !== null);

            if (imageFiles.length > 0) {
                event.preventDefault();
                const filesWithNames = imageFiles.map((blob, i) => new File([blob], `pasted-image-${Date.now() + i}.${blob.type.split('/')[1] || 'png'}`, { type: blob.type }));
                handleFileChange(filesWithNames);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleFileChange]);

    const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files);
    }, [handleFileChange]);

    const uploaderInputId = `file-upload-${uploaderId}`;
    
    if (mode === GenerationMode.PHOTO && images.length > 0) {
        return (
            <div 
                className="space-y-3"
                onMouseEnter={() => { isHoveringRef.current = true; }}
                onMouseLeave={() => { isHoveringRef.current = false; }}
            >
                 <input
                    id={uploaderInputId}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    multiple
                    onChange={(e) => handleFileChange(e.target.files)}
                />
                <div className="grid grid-cols-3 gap-2">
                    {previewUrls.map((url, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                             <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                             <div className="absolute top-1 right-1 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleCropImage(e, index)} className="p-1 bg-black/60 rounded-full text-white hover:bg-blue-500 transition-colors" aria-label="Crop image">
                                    <CropIcon className="w-3 h-3"/>
                                </button>
                                <button onClick={() => handleRemoveImage(index)} className="p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors" aria-label="Remove image">
                                    <XMarkIcon className="w-3 h-3"/>
                                </button>
                             </div>
                        </div>
                    ))}
                    {images.length < 5 && (
                         <div
                            onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
                            onClick={() => document.getElementById(uploaderInputId)?.click()}
                            className={`flex flex-col items-center justify-center aspect-square border border-dashed rounded-lg text-center cursor-pointer transition-colors
                                ${isDragging ? 'border-brand-light dark:border-brand-dark bg-indigo-50 dark:bg-slate-700/50' : 'border-slate-300 dark:border-slate-600 hover:border-brand-light dark:hover:border-brand-dark'}`}
                         >
                            <UploadIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <div 
            onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
            className={`relative border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 bg-slate-50/50 dark:bg-slate-800/50
                ${isDragging ? 'border-brand-light dark:border-brand-dark bg-indigo-50 dark:bg-slate-700/50' : 'border-slate-300 dark:border-slate-600 hover:border-brand-light dark:hover:border-brand-dark'}
            `}
            onClick={() => document.getElementById(uploaderInputId)?.click()}
            onMouseEnter={() => { isHoveringRef.current = true; }}
            onMouseLeave={() => { isHoveringRef.current = false; }}
        >
            <input 
                id={uploaderInputId} 
                type="file" 
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                multiple={mode === GenerationMode.PHOTO}
                onChange={(e) => handleFileChange(e.target.files)} 
            />
            {previewUrls.length > 0 ? (
                <>
                    <div className="relative group inline-block w-full">
                        <img src={previewUrls[0]} alt="Preview" className="mx-auto max-h-40 rounded-md shadow-sm object-contain" />
                        <div className="absolute top-1 right-1 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => handleCropImage(e, 0)}
                                className="p-1 bg-black/60 rounded-full text-white hover:bg-blue-500 transition-colors"
                                aria-label="Crop image"
                            >
                                <CropIcon className="w-3 h-3"/>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveImage(0);
                                }}
                                className="p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                                aria-label="Remove image"
                            >
                                <XMarkIcon className="w-3 h-3"/>
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-2 text-slate-500 dark:text-slate-400 py-2">
                    <UploadIcon className="w-6 h-6 opacity-50" />
                    <p className="font-medium text-xs">点击上传</p>
                </div>
            )}
        </div>
    );
});
ImageUploader.displayName = 'ImageUploader';


export const InputNode: React.FC<ControlPanelProps> = React.memo((props) => {
    const { 
        generationMode,
        genParams, setGenParams,
        originalImages, setOriginalImages,
        frameStyleSourceImage, setFrameStyleSourceImage,
        buttonStyleSourceImage, setButtonStyleSourceImage,
        fontSourceImage, setFontSourceImage,
        fontStyleSourceImage, setFontStyleSourceImage,
        onCrop, onAddTemplate, onOpenLibrary,
        isLibraryFull, isRemovingText, onRemoveText,
        onHeaderMouseDown
    } = props;

    const [isJustSaved, setIsJustSaved] = useState(false);
    
    const isFontMode = generationMode === GenerationMode.FONT;
    const isElementMode = generationMode === GenerationMode.ELEMENT;
    const isElementButtonMode = isElementMode && genParams.elementMode === 'button';
    const isElementButtonRestyleMode = isElementButtonMode && genParams.buttonMode === 'restyle';
    const isFrameRestyleMode = generationMode === GenerationMode.FRAME && genParams.frameMode === 'restyle';
    const isFrameBubbleMode = generationMode === GenerationMode.FRAME && genParams.frameMode === 'bubble';
    const isFrameGenerateMode = generationMode === GenerationMode.FRAME && genParams.frameMode === 'generate';
    const isBackgroundElementMode = isElementMode && genParams.elementMode === 'background';
    const hasInput = originalImages.length > 0 || fontSourceImage.length > 0 || (isElementMode && genParams.elementMode === 'elements') || isFrameGenerateMode;

    const updateParams = useCallback(<K extends keyof GenerationParams>(key: K, value: GenerationParams[K]) => {
        setGenParams(p => ({ ...p, [key]: value }));
    }, [setGenParams]);

     const handleSaveToLibrary = async () => {
        if (originalImages.length > 0 && !isLibraryFull) {
            await onAddTemplate();
            setIsJustSaved(true);
            setTimeout(() => setIsJustSaved(false), 2000);
        }
    };

    const handleFontModeChange = (newMode: GenerationParams['fontMode']) => {
        updateParams('fontMode', newMode);
    };

    return (
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800 w-[400px] flex flex-col pointer-events-auto">
            <NodeHeader number="01" title="Input Node" colorClass="bg-gradient-to-r from-blue-500 to-indigo-500" onMouseDown={onHeaderMouseDown} />
            
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400">01</span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">输入</h3>
                </div>
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            </div>

            <ConnectionPort position="right" active={hasInput} />
            
            <div className="p-5 space-y-5">
                {generationMode === GenerationMode.FRAME && (
                     <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {['generate', 'restyle', 'bubble'].map((m) => (
                            <button
                                key={m}
                                onClick={() => updateParams('frameMode', m as any)}
                                className={`py-1.5 text-[10px] font-medium rounded-md transition-all ${genParams.frameMode === m ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                            >
                                {m === 'generate' ? '主题生成' : m === 'restyle' ? '风格迁移' : '轮廓化'}
                            </button>
                        ))}
                    </div>
                )}

                {isElementMode && (
                     <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {['elements', 'background', 'button'].map((m) => (
                            <button
                                key={m}
                                onClick={() => updateParams('elementMode', m as any)}
                                className={`py-1.5 text-[10px] font-medium rounded-md transition-all ${genParams.elementMode === m ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                            >
                                {m === 'elements' ? '贴图' : m === 'background' ? '提取' : '按钮'}
                            </button>
                        ))}
                    </div>
                )}

                {isElementButtonMode && (
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <button
                            onClick={() => updateParams('buttonMode', 'generate')}
                            className={`py-1.5 text-[10px] font-medium rounded-md transition-all ${genParams.buttonMode === 'generate' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            主题生成
                        </button>
                            <button
                            onClick={() => updateParams('buttonMode', 'restyle')}
                            className={`py-1.5 text-[10px] font-medium rounded-md transition-all ${genParams.buttonMode === 'restyle' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            材质迁移
                        </button>
                    </div>
                )}

                {isFontMode && (
                     <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <button
                            onClick={() => handleFontModeChange('generate-restyle')}
                            className={`py-1.5 text-[10px] font-medium rounded-md transition-all ${genParams.fontMode === 'generate-restyle' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            生成/变体
                        </button>
                            <button
                            onClick={() => handleFontModeChange('bubble')}
                            className={`py-1.5 text-[10px] font-medium rounded-md transition-all ${genParams.fontMode === 'bubble' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            气泡文字
                        </button>
                            <button
                            onClick={() => handleFontModeChange('modify')}
                            className={`py-1.5 text-[10px] font-medium rounded-md transition-all ${genParams.fontMode === 'modify' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            替换文字
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                     {isFrameRestyleMode || isFrameBubbleMode ? (
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isFrameBubbleMode ? '1. 轮廓线稿' : '1. 形状模板'}</label>
                            <ImageUploader images={originalImages} setImages={setOriginalImages} onCrop={onCrop} uploaderId="original" mode={generationMode} />
                            
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">2. 风格参考图</label>
                            <ImageUploader images={frameStyleSourceImage} setImages={setFrameStyleSourceImage} onCrop={onCrop} uploaderId="frameStyleSource" mode={generationMode} />
                        </div>
                    ) : isElementButtonRestyleMode ? (
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">1. 按钮形状</label>
                            <ImageUploader images={originalImages} setImages={setOriginalImages} onCrop={onCrop} uploaderId="original" mode={generationMode} />
                            
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">2. 材质参考图</label>
                            <ImageUploader images={buttonStyleSourceImage} setImages={setButtonStyleSourceImage} onCrop={onCrop} uploaderId="buttonStyleSource" mode={generationMode} />
                        </div>
                    ) : isFontMode ? (
                        <>
                             {(genParams.fontMode === 'generate-restyle' || genParams.fontMode === 'bubble') && (
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">文字内容</label>
                                    <input
                                        type="text"
                                        placeholder="输入要生成的艺术字"
                                        value={genParams.fontText}
                                        onChange={(e) => updateParams('fontText', e.target.value)}
                                        className="w-full p-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        disabled={fontSourceImage.length > 0 && genParams.fontMode !== 'bubble'}
                                    />
                                    {genParams.fontMode === 'generate-restyle' && (
                                        <>
                                            <div className="relative flex py-1 items-center">
                                                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                                <span className="flex-shrink-0 mx-4 text-[10px] text-slate-400">以下二选一</span>
                                                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">1. 基础文字图 (可选 - 用于结构参考)</label>
                                                <ImageUploader images={fontSourceImage} setImages={setFontSourceImage} onCrop={onCrop} uploaderId="fontSource" mode={generationMode} />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">2. 风格参考图 (可选 - 用于材质/纹理)</label>
                                                <ImageUploader images={fontStyleSourceImage} setImages={setFontStyleSourceImage} onCrop={onCrop} uploaderId="fontStyleSource" mode={generationMode} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                             {genParams.fontMode === 'modify' && (
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">源图片</label>
                                    <ImageUploader images={fontSourceImage} setImages={setFontSourceImage} onCrop={onCrop} uploaderId="fontSource" mode={generationMode} />
                                    
                                    <div className="space-y-2 pt-2">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">替换内容</label>
                                        <input
                                            type="text"
                                            placeholder="输入替换后的文字"
                                            value={genParams.fontText}
                                            onChange={(e) => updateParams('fontText', e.target.value)}
                                            className="w-full p-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : isElementMode ? (
                        <>
                            {isElementButtonMode ? (
                                <div className="space-y-4">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">按钮参考</label>
                                    <ImageUploader images={originalImages} setImages={setOriginalImages} onCrop={onCrop} uploaderId="original" mode={generationMode} elementMode={genParams.elementMode} />
                                    {originalImages.length > 0 && (
                                         <div className="grid grid-cols-2 gap-2 text-xs">
                                            <button
                                                onClick={handleSaveToLibrary}
                                                disabled={isLibraryFull || isJustSaved}
                                                className={`flex items-center justify-center gap-1 px-2 py-2 border rounded-lg transition-colors ${isJustSaved ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-brand-light'}`}
                                            >
                                                <BookmarkIcon className="w-3 h-3" />
                                                <span>{isJustSaved ? "已保存" : "保存素材"}</span>
                                            </button>
                                             <button
                                                onClick={onOpenLibrary}
                                                className="flex items-center justify-center gap-1 px-2 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-brand-light transition-colors"
                                            >
                                                <FolderIcon className="w-3 h-3"/>
                                                <span>素材库</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : isBackgroundElementMode ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">源图片</label>
                                    <ImageUploader images={originalImages} setImages={setOriginalImages} onCrop={onCrop} uploaderId="original" mode={generationMode} elementMode={genParams.elementMode} />
                                </div>
                            ) : (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                                        <SparklesIcon className="w-4 h-4" />
                                        <span className="text-sm font-bold">AI 创意模式</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        无需上传图片。请在下一步输入主题，AI 将自动联想并生成一组风格统一的装饰元素。
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                基础图片 
                                {isFrameGenerateMode && <span className="text-[10px] font-normal text-slate-400 ml-1">(可选 - 如不上传则随机生成)</span>}
                            </label>
                            <ImageUploader images={originalImages} setImages={setOriginalImages} onCrop={onCrop} uploaderId="original" mode={generationMode} />
                            
                            {isFrameGenerateMode && (
                                <>
                                    <div className="relative flex py-1 items-center">
                                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                        <span className="flex-shrink-0 mx-2 text-[10px] text-slate-400 uppercase">可选输入</span>
                                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                    </div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">风格参考图</label>
                                    <ImageUploader images={frameStyleSourceImage} setImages={setFrameStyleSourceImage} onCrop={onCrop} uploaderId="frameStyleSource" mode={generationMode} />
                                </>
                            )}

                            { (generationMode === GenerationMode.FRAME || generationMode === GenerationMode.BACKGROUND) && originalImages.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <button
                                        onClick={handleSaveToLibrary}
                                        disabled={isLibraryFull || isJustSaved}
                                        className={`flex items-center justify-center gap-1 px-2 py-2 border rounded-lg transition-colors ${isJustSaved ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-brand-light'}`}
                                    >
                                        <BookmarkIcon className="w-3 h-3" />
                                        <span>{isJustSaved ? "已保存" : "保存素材"}</span>
                                    </button>
                                     <button
                                        onClick={onOpenLibrary}
                                        className="flex items-center justify-center gap-1 px-2 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-brand-light transition-colors"
                                    >
                                        <FolderIcon className="w-3 h-3"/>
                                        <span>素材库</span>
                                    </button>
                                </div>
                            )}
                            { (generationMode === GenerationMode.FRAME || generationMode === GenerationMode.BACKGROUND || generationMode === GenerationMode.PHOTO) && originalImages.length > 0 && (
                                <button
                                    onClick={onRemoveText}
                                    disabled={isRemovingText || originalImages.length > 1}
                                    className="w-full flex items-center justify-center gap-2 px-2 py-2 border rounded-lg transition-colors text-xs bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-brand-light disabled:opacity-50"
                                >
                                    {isRemovingText ? <LoadingSpinner className="w-3 h-3" /> : <EraserIcon className="w-3 h-3" />}
                                    <span>{isRemovingText ? "处理中..." : "移除文字"}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
InputNode.displayName = 'InputNode';

const getFrameVariationLabel = (level: number) => {
    if (level <= 10) return '复制模式';
    if (level <= 35) return '高保真';
    if (level <= 65) return '演变模式';
    return '创意重构';
};

const getFontIntensityLabel = (level: number) => {
    if (level <= 30) return '简约实用';
    if (level <= 70) return '艺术平衡';
    return '极致华丽';
};

export const SettingsNode: React.FC<ControlPanelProps> = React.memo((props) => {
    const { 
        genParams, setGenParams,
        count, setCount,
        onGenerate, isLoading,
        generationMode,
        onGenerateBackground, isGeneratingBackground,
        onGenerateProps, isGeneratingProps,
        onGeneratePropsForTheme, isGeneratingThemeProps,
        onGenerateElements, isGeneratingElements,
        onExpandTheme, isExpandingTheme,
        originalImages, fontSourceImage, frameStyleSourceImage, buttonStyleSourceImage,
        onResetContext,
        onHeaderMouseDown
    } = props;
    
    const [fontSimpleTheme, setFontSimpleTheme] = useState('');

    const isFontMode = generationMode === GenerationMode.FONT;
    const isElementMode = generationMode === GenerationMode.ELEMENT;
    const isBackgroundElementMode = isElementMode && genParams.elementMode === 'background';
    const isElementButtonMode = isElementMode && genParams.elementMode === 'button';
    const isElementButtonRestyleMode = isElementButtonMode && genParams.buttonMode === 'restyle';
    const isBatchMode = generationMode === GenerationMode.PHOTO && originalImages.length > 1;
    const isFontGenerateMode = isFontMode && (genParams.fontMode === 'generate-restyle' && fontSourceImage.length === 0) || (isFontMode && genParams.fontMode === 'bubble');
    const isFontRestyleMode = isFontMode && genParams.fontMode === 'generate-restyle' && fontSourceImage.length > 0;
    const isFontModifyMode = isFontMode && genParams.fontMode === 'modify';
    const isFrameRestyleMode = generationMode === GenerationMode.FRAME && genParams.frameMode === 'restyle';
    const isFrameBubbleMode = generationMode === GenerationMode.FRAME && genParams.frameMode === 'bubble';
    const isFrameGenerateMode = generationMode === GenerationMode.FRAME && genParams.frameMode === 'generate';
    const isNoImageFrameGen = isFrameGenerateMode && originalImages.length === 0;

    const isCountSliderDisabled = isBatchMode || isFontModifyMode || isFontRestyleMode;
    let displayCount = isCountSliderDisabled ? 1 : count;

    const showThemeInput = !(isFontMode && genParams.fontMode === 'modify') && !isElementButtonRestyleMode && !isBackgroundElementMode && !isFrameRestyleMode && !isFrameBubbleMode;
    const showElementsInput = (generationMode === GenerationMode.FRAME && genParams.frameMode !== 'restyle' && genParams.frameMode !== 'bubble') || (isElementMode && (genParams.elementMode === 'elements' || (genParams.elementMode === 'button' && genParams.buttonMode === 'generate')));
    const showPropsInput = generationMode === GenerationMode.PHOTO;
    const showAspectRatioSelector = [GenerationMode.PHOTO, GenerationMode.BACKGROUND].includes(generationMode) || isFontGenerateMode || isNoImageFrameGen;
    const showColorSelector = showThemeInput;
    
    const showFontMaterial = false; 
    
    const showButtonMaterial = isElementButtonMode && genParams.buttonMode === 'generate';
    const showStyleSelector = showThemeInput || isFrameBubbleMode;
    
    // Updated showVariationSlider to include FONT mode
    const showVariationSlider = (generationMode === GenerationMode.FRAME && !isNoImageFrameGen) || 
                               (generationMode === GenerationMode.PHOTO && !genParams.productThemeLock) ||
                               (generationMode === GenerationMode.FONT && genParams.fontMode !== 'modify');

    const showBackgroundSelector = (generationMode === GenerationMode.FRAME || isElementButtonMode) || isFontGenerateMode;
    const showProductLock = generationMode === GenerationMode.PHOTO;
    const showFrameShapeStrategy = isFrameGenerateMode && originalImages.length > 0;

    const backgroundStyleOptions = [
        { label: '可爱纹理', value: StyleOption.CUTE_PATTERN },
        { label: '梦幻光斑', value: StyleOption.DREAMY_BOKEH },
        { label: '活力射线', value: StyleOption.VIBRANT_RAYS },
        { label: '梦幻柔光', value: StyleOption.ILLUSTRATION },
    ];
    
    const elementAspectRatioOptions = [
        { label: '横向 16:9', value: '16:9' },
        { label: '纵向 9:16', value: '9:16' },
        { label: '方形 1:1', value: '1:1' },
        { label: '标准 4:3', value: '4:3' },
    ];
    
    const fontAspectRatioOptions = [
        { label: '横屏 (16:9)', value: '16:9' },
        { label: '标准 (4:3)', value: '4:3' },
        { label: '方形 (1:1)', value: '1:1' },
    ];

    const photoAspectRatioOptions = [
        { label: '原图比例', value: 'source' },
        { label: '横向 16:9', value: '16:9' },
        { label: '纵向 9:16', value: '9:16' },
        { label: '方形 1:1', value: '1:1' },
        { label: '标准 4:3', value: '4:3' },
        { label: '标准 3:4', value: '3:4' },
    ];

    const updateParams = useCallback(<K extends keyof GenerationParams>(key: K, value: GenerationParams[K]) => {
        setGenParams(p => ({ ...p, [key]: value }));
    }, [setGenParams]);
    
    const handleInternalReset = () => {
        setFontSimpleTheme('');
        onResetContext();
    };

    let isGenerateDisabled = isLoading;
    if (!isGenerateDisabled) {
        if (isFrameRestyleMode || isFrameBubbleMode) {
            if (originalImages.length === 0 || frameStyleSourceImage.length === 0) isGenerateDisabled = true;
        } else if (isFrameGenerateMode) {
            if (originalImages.length === 0 && !genParams.theme.trim()) isGenerateDisabled = true;
        } else if (isFontMode) {
            if (genParams.fontMode === 'generate-restyle') {
                if (fontSourceImage.length === 0 && !genParams.fontText.trim()) isGenerateDisabled = true;
            } else if (genParams.fontMode === 'bubble') {
                if (!genParams.fontText.trim()) isGenerateDisabled = true;
            } else { 
                if (fontSourceImage.length === 0 || !genParams.fontText.trim()) isGenerateDisabled = true;
            }
        } else if (isElementButtonMode) {
            if(genParams.buttonMode === 'restyle') {
                if (originalImages.length === 0 || buttonStyleSourceImage.length === 0) isGenerateDisabled = true;
            } else {
                if(originalImages.length === 0) isGenerateDisabled = true;
            }
        } else if (isElementMode) {
            if (genParams.elementMode === 'background') {
                if (originalImages.length === 0) isGenerateDisabled = true;
            } else if (genParams.elementMode === 'elements') {
                 if (!genParams.theme.trim()) isGenerateDisabled = true;
            }
        } else {
            if (originalImages.length === 0) isGenerateDisabled = true;
        }
    }

    const generateButtonText = () => {
        if (isBatchMode) return `生成 ${originalImages.length} 张图片`;
        switch (generationMode) {
            case GenerationMode.FRAME:
                if (genParams.frameMode === 'restyle') return '开始迁移';
                if (genParams.frameMode === 'bubble') return '开始轮廓化';
                if (isNoImageFrameGen) return '自由生成';
                return '生成画框';
            case GenerationMode.PHOTO: return '开始变换';
            case GenerationMode.BACKGROUND: return '生成背景';
            case GenerationMode.ELEMENT:
                if (genParams.elementMode === 'button') {
                    return genParams.buttonMode === 'restyle' ? '迁移材质' : '生成按钮';
                }
                return genParams.elementMode === 'background' ? '提取元素' : '生成元素';
            case GenerationMode.FONT:
                if (genParams.fontMode === 'generate-restyle') {
                    return fontSourceImage.length > 0 ? '变换风格' : '生成字体';
                }
                 if (genParams.fontMode === 'bubble') return '生成气泡文字';
                return '替换文字';
            default: return '生成';
        }
    };

    return (
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800 w-[400px] flex flex-col pointer-events-auto">
            <NodeHeader number="02" title="Settings" colorClass="bg-gradient-to-r from-purple-500 to-pink-500" onMouseDown={onHeaderMouseDown} />
            
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30 text-[10px] font-bold text-purple-600 dark:text-purple-400">02</span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">参数配置</h3>
                </div>
                <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
            </div>

            <ConnectionPort position="left" active={true} />
            <ConnectionPort position="right" active={true} />

            <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                
                 {showThemeInput && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">主题描述</label>
                        <div className="flex gap-2">
                             <input
                                type="text"
                                placeholder={isFontRestyleMode ? "例如：发光金属质感" : "例如：夏日海滩"}
                                value={genParams.theme}
                                onChange={e => updateParams('theme', e.target.value)}
                                className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                            {generationMode === GenerationMode.PHOTO && (
                                <button
                                    onClick={onGenerateBackground}
                                    disabled={isGeneratingBackground || originalImages.length === 0}
                                    className="flex-shrink-0 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:text-purple-500 transition-colors disabled:opacity-50"
                                >
                                    {isGeneratingBackground ? <LoadingSpinner className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                                </button>
                            )}
                            <button
                                onClick={() => onExpandTheme()}
                                disabled={isExpandingTheme || !genParams.theme.trim()}
                                className="flex-shrink-0 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:text-purple-500 transition-colors disabled:opacity-50"
                            >
                                {isExpandingTheme ? <LoadingSpinner className="w-4 h-4"/> : <SparklesIcon className="w-4 h-4"/>}
                            </button>
                        </div>
                        {isFontGenerateMode && (
                                <div className="flex gap-2 mt-1">
                                    <input
                                    type="text"
                                    placeholder="输入简单概念，AI 自动扩展"
                                    value={fontSimpleTheme}
                                    onChange={e => setFontSimpleTheme(e.target.value)}
                                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                                    <button
                                    onClick={() => onExpandTheme(fontSimpleTheme)}
                                    disabled={isExpandingTheme || !fontSimpleTheme.trim()}
                                    className="flex-shrink-0 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:text-purple-500 transition-colors disabled:opacity-50"
                                >
                                    {isExpandingTheme ? <LoadingSpinner className="w-3 h-3"/> : <SparklesIcon className="w-3 h-3"/>}
                                </button>
                                </div>
                        )}
                    </div>
                )}
                
                {showFrameShapeStrategy && (
                     <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">形状策略</label>
                        <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            {(['original', 'dynamic', 'creative'] as FrameShapeStrategy[]).map(opt => (
                                <button 
                                    key={opt} 
                                    onClick={() => updateParams('frameShapeStrategy', opt)} 
                                    className={`flex-1 py-1.5 text-[10px] transition-colors ${genParams.frameShapeStrategy === opt ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
                                >
                                    {translateFrameShapeStrategy(opt)}
                                </button>
                            ))}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">
                            {genParams.frameShapeStrategy === 'original' && '保持原图轮廓，仅改变材质纹理。'}
                            {genParams.frameShapeStrategy === 'dynamic' && '根据主题智能修改边缘和细节(推荐)。'}
                            {genParams.frameShapeStrategy === 'creative' && '仅参考位置，生成全新形状。'}
                        </p>
                    </div>
                )}
                
                {(showElementsInput || showPropsInput) && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                        {showElementsInput && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">装饰元素</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="例如：星星, 月亮, 宝石"
                                        value={genParams.elements}
                                        onChange={e => updateParams('elements', e.target.value)}
                                        className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                    <button
                                        onClick={onGenerateElements}
                                        disabled={isGeneratingElements || !genParams.theme.trim()}
                                        className="flex-shrink-0 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:text-purple-500 transition-colors disabled:opacity-50"
                                    >
                                        {isGeneratingElements ? <LoadingSpinner className="w-4 h-4"/> : <SparklesIcon className="w-4 h-4"/>}
                                    </button>
                                </div>
                            </div>
                        )}
                        {showPropsInput && (
                             <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">场景道具</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="例如：鲜花, 书本"
                                        value={genParams.props}
                                        onChange={e => updateParams('props', e.target.value)}
                                        className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                    <button
                                        onClick={onGenerateProps}
                                        disabled={isGeneratingProps || originalImages.length === 0}
                                        className="flex-shrink-0 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:text-purple-500 transition-colors disabled:opacity-50"
                                        title="智能识图"
                                    >
                                        {isGeneratingProps ? <LoadingSpinner className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                                    </button>
                                    <button
                                        onClick={onGeneratePropsForTheme}
                                        disabled={isGeneratingThemeProps || !genParams.theme.trim()}
                                        className="flex-shrink-0 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:text-purple-500 transition-colors disabled:opacity-50"
                                        title="主题联想"
                                    >
                                        {isGeneratingThemeProps ? <LoadingSpinner className="w-4 h-4"/> : <SparklesIcon className="w-4 h-4"/>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                     <div className="grid grid-cols-2 gap-3">
                        {showAspectRatioSelector && (
                             <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">画面比例</label>
                                <select 
                                    value={genParams.aspectRatio}
                                    onChange={e => updateParams('aspectRatio', e.target.value)}
                                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                                >
                                    {
                                        (generationMode === GenerationMode.PHOTO || generationMode === GenerationMode.BACKGROUND) ? photoAspectRatioOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>) :
                                        (isFontGenerateMode || isNoImageFrameGen) ? fontAspectRatioOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>) :
                                        elementAspectRatioOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                                    }
                                </select>
                             </div>
                        )}
                        {showBackgroundSelector && (
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">背景类型</label>
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                    {Object.values(BackgroundOption).map(opt => (
                                        <button key={opt} onClick={() => updateParams('background', opt)} className={`flex-1 py-2 text-[10px] transition-colors ${genParams.background === opt ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}>{translateBackgroundOption(opt)}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                     </div>

                    {showColorSelector && (
                        <div>
                             <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">主色调</label>
                                <div className="flex items-center">
                                    <input type="checkbox" id="use-color" checked={genParams.useColor} onChange={e => updateParams('useColor', e.target.checked)} className="mr-1.5 h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                    <label htmlFor="use-color" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">启用</label>
                                </div>
                            </div>
                            <div className={`flex gap-2 transition-opacity ${!genParams.useColor ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input type="color" value={genParams.color} onChange={e => updateParams('color', e.target.value)} className="p-0.5 h-8 w-10 block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer rounded-md" />
                                <input type="text" value={genParams.color} onChange={e => updateParams('color', e.target.value)} className="flex-1 p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 uppercase" />
                            </div>
                        </div>
                    )}
                    
                    {(showFontMaterial || showButtonMaterial) && (
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">材质风格</label>
                                {showButtonMaterial && (
                                     <div className="flex items-center">
                                        <input type="checkbox" id="use-mat" checked={genParams.useFontMaterial} onChange={e => updateParams('useFontMaterial', e.target.checked)} className="mr-1.5 h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                        <label htmlFor="use-mat" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">启用</label>
                                    </div>
                                )}
                            </div>
                            <div className={`grid grid-cols-3 gap-1 ${showButtonMaterial && !genParams.useFontMaterial ? 'opacity-50 pointer-events-none' : ''}`}>
                                {Object.values(ButtonMaterialOption).map(opt => (
                                    <button key={opt} onClick={() => updateParams(isFontMode ? 'fontMaterial' : (showButtonMaterial ? 'buttonMaterial' : 'elementMaterial'), opt)} className={`px-2 py-1.5 text-[10px] rounded-md border transition-colors ${ (isFontMode ? genParams.fontMaterial : (showButtonMaterial ? genParams.buttonMaterial : genParams.elementMaterial)) === opt ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'}`}>{translateButtonMaterialOption(opt)}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {showStyleSelector && (
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">艺术风格</label>
                             {isBackgroundElementMode ? (
                                <div className="grid grid-cols-2 gap-1">
                                    {backgroundStyleOptions.map(opt => (
                                            <button key={opt.value} onClick={() => updateParams('style', opt.value)} className={`px-2 py-1.5 text-[10px] rounded-md border transition-colors ${genParams.style === opt.value ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'}`}>{opt.label}</button>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1">
                                    {[StyleOption.DEFAULT, StyleOption.VECTOR, StyleOption.WATERCOLOR, StyleOption.ILLUSTRATION, StyleOption.THREED_RENDER, StyleOption.PIXEL_ART].map(opt => (
                                        <button key={opt} onClick={() => updateParams('style', opt)} className={`px-2 py-1.5 text-[10px] rounded-md border transition-colors ${genParams.style === opt ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'}`}>{translateStyleOption(opt)}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {showVariationSlider && (
                        <div>
                             <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {generationMode === GenerationMode.FONT ? '风格强度' : '变化幅度'}
                                    <span className="ml-2 text-[10px] font-medium text-purple-600 dark:text-purple-400">
                                        {generationMode === GenerationMode.FONT 
                                            ? getFontIntensityLabel(genParams.variationLevel) 
                                            : getFrameVariationLabel(genParams.variationLevel)}
                                    </span>
                                </label>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{genParams.variationLevel}%</span>
                            </div>
                            
                            <div className="relative w-full">
                                {generationMode === GenerationMode.FRAME && (
                                    <>
                                        <div className="absolute top-0 bottom-0 left-[10%] w-px bg-white dark:bg-slate-900 z-20 pointer-events-none mix-blend-difference opacity-50"></div>
                                        <div className="absolute top-0 bottom-0 left-[35%] w-px bg-white dark:bg-slate-900 z-20 pointer-events-none mix-blend-difference opacity-50"></div>
                                        <div className="absolute top-0 bottom-0 left-[65%] w-px bg-white dark:bg-slate-900 z-20 pointer-events-none mix-blend-difference opacity-50"></div>
                                    </>
                                )}
                                {generationMode === GenerationMode.FONT && (
                                    <>
                                        <div className="absolute top-0 bottom-0 left-[30%] w-px bg-white dark:bg-slate-900 z-20 pointer-events-none mix-blend-difference opacity-50"></div>
                                        <div className="absolute top-0 bottom-0 left-[70%] w-px bg-white dark:bg-slate-900 z-20 pointer-events-none mix-blend-difference opacity-50"></div>
                                    </>
                                )}
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={genParams.variationLevel}
                                    onChange={e => updateParams('variationLevel', parseInt(e.target.value, 10))}
                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-purple-600 relative z-10"
                                />
                            </div>

                             {generationMode === GenerationMode.FRAME ? (
                                <div className="relative h-6 mt-2 w-full text-[9px] font-medium text-slate-400 select-none">
                                    <div className={`absolute left-[5%] -translate-x-1/2 cursor-pointer transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${genParams.variationLevel <= 10 ? 'text-purple-600 font-bold' : ''}`} onClick={() => updateParams('variationLevel', 5)}>复制</div>
                                    <div className={`absolute left-[23%] -translate-x-1/2 cursor-pointer transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${genParams.variationLevel > 10 && genParams.variationLevel <= 35 ? 'text-purple-600 font-bold' : ''}`} onClick={() => updateParams('variationLevel', 23)}>高保真</div>
                                    <div className={`absolute left-[50%] -translate-x-1/2 cursor-pointer transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${genParams.variationLevel > 35 && genParams.variationLevel <= 65 ? 'text-purple-600 font-bold' : ''}`} onClick={() => updateParams('variationLevel', 50)}>演变</div>
                                    <div className={`absolute left-[83%] -translate-x-1/2 cursor-pointer transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${genParams.variationLevel > 65 ? 'text-purple-600 font-bold' : ''}`} onClick={() => updateParams('variationLevel', 83)}>重构</div>
                                </div>
                            ) : generationMode === GenerationMode.FONT ? (
                                <div className="relative h-6 mt-2 w-full text-[9px] font-medium text-slate-400 select-none">
                                    <div className={`absolute left-[15%] -translate-x-1/2 cursor-pointer transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${genParams.variationLevel <= 30 ? 'text-purple-600 font-bold' : ''}`} onClick={() => updateParams('variationLevel', 15)}>简约</div>
                                    <div className={`absolute left-[50%] -translate-x-1/2 cursor-pointer transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${genParams.variationLevel > 30 && genParams.variationLevel <= 70 ? 'text-purple-600 font-bold' : ''}`} onClick={() => updateParams('variationLevel', 50)}>标准</div>
                                    <div className={`absolute left-[85%] -translate-x-1/2 cursor-pointer transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${genParams.variationLevel > 70 ? 'text-purple-600 font-bold' : ''}`} onClick={() => updateParams('variationLevel', 85)}>华丽</div>
                                </div>
                            ) : (
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                    <span>微调</span>
                                    <span>重绘</span>
                                </div>
                            )}
                        </div>
                    )}
                    
                     {showProductLock && (
                         <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">主体锁定 (仅换背景)</span>
                             <div className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={genParams.productThemeLock} onChange={e => updateParams('productThemeLock', e.target.checked)} />
                                <div className="w-7 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex gap-4 items-center mb-3">
                         <div className="flex-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">生成数量: {displayCount}</label>
                            <input
                                type="range"
                                min="1"
                                max="8"
                                value={displayCount}
                                onChange={e => setCount(parseInt(e.target.value, 10))}
                                className={`w-full h-1 bg-slate-200 rounded-lg appearance-none dark:bg-slate-700 accent-purple-600 ${isCountSliderDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                disabled={isCountSliderDisabled}
                            />
                        </div>
                        <button
                             onClick={handleInternalReset}
                             disabled={isLoading}
                             className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                             title="重置参数"
                        >
                            <RefreshIcon className="w-4 h-4"/>
                        </button>
                    </div>

                    <button
                        onClick={onGenerate}
                        disabled={isGenerateDisabled}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                    >
                        {isLoading ? <LoadingSpinner className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
                        <span>{isLoading ? '正在生成...' : generateButtonText()}</span>
                    </button>
                </div>

            </div>
        </div>
    );
});
SettingsNode.displayName = 'SettingsNode';
