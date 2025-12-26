
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage, GenerationMode } from '../types';
import { EyeIcon, PencilIcon, TrashIcon, DownloadIcon, SparklesIcon, LoadingSpinner, MagicWandIcon, StarIcon, TypeIcon, LayersIcon, Grid2x2Icon, Grid3x3Icon, ListBulletIcon } from './Icons';

interface ImageCardProps {
    image: GeneratedImage;
    onView: (image: GeneratedImage) => void;
    onEdit: (image: GeneratedImage) => void;
    onDelete: (id: string) => void;
    onModify: (image: GeneratedImage) => void;
    onEnhance: (image: GeneratedImage) => void;
    onSendToFont: (image: GeneratedImage) => void;
    onUseAsSource: (image: GeneratedImage, useAs: 'shape' | 'style') => void;
    onUseAsMaterial: (image: GeneratedImage) => void;
    viewMode: 'small' | 'large' | 'list';
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onView, onEdit, onDelete, onModify, onEnhance, onSendToFont, onUseAsSource, onUseAsMaterial, viewMode }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const isList = viewMode === 'list';

    return (
        <div className={`relative group ${isList ? 'flex gap-4 p-3 h-24' : 'aspect-square'} overflow-visible rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300`}>
            <div className={`relative overflow-hidden rounded-lg ${isList ? 'w-20 h-full shrink-0' : 'w-full h-full'}`}>
                <img src={image.imageUrl} alt={image.params.theme} className="w-full h-full object-cover" />
                {!isList && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>}
            </div>
            
            {isList && (
                <div className="flex-1 flex flex-col justify-center min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{image.params.theme || 'Untitled'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">Mode: {image.mode}</p>
                </div>
            )}

            <div className={`${isList ? 'relative flex items-center' : 'absolute inset-x-2 bottom-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'} transition-all duration-200 z-10`}>
                <div className={`flex flex-wrap justify-center items-center gap-1 ${isList ? '' : 'p-1 bg-white/20 backdrop-blur-md rounded-lg border border-white/20'}`}>
                    <button onClick={() => onView(image)} className={`p-1 rounded transition-colors ${isList ? 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700' : 'hover:bg-white/20 text-white'}`} title="预览"><EyeIcon className="w-3.5 h-3.5"/></button>
                    <button onClick={() => onEnhance(image)} className={`p-1 rounded transition-colors ${isList ? 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700' : 'hover:bg-white/20 text-white'}`} title="增强"><StarIcon className="w-3.5 h-3.5"/></button>
                    <button onClick={() => onModify(image)} className={`p-1 rounded transition-colors ${isList ? 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700' : 'hover:bg-white/20 text-white'}`} title="修改"><MagicWandIcon className="w-3.5 h-3.5"/></button>
                    
                    <div className="relative">
                        <button onClick={() => setIsMenuOpen(o => !o)} className={`p-1 rounded transition-colors ${isList ? 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700' : 'hover:bg-white/20 text-white'}`} title="用作素材">
                            <LayersIcon className="w-3.5 h-3.5"/>
                        </button>
                        {isMenuOpen && (
                            <div ref={menuRef} className="absolute bottom-full mb-2 right-0 bg-slate-800/95 backdrop-blur rounded-lg shadow-xl border border-slate-700 text-[10px] z-50 w-28 py-1">
                                <button onClick={() => { onUseAsSource(image, 'shape'); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-white hover:bg-white/10 transition-colors">用作(框)形状</button>
                                <button onClick={() => { onUseAsSource(image, 'style'); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-white hover:bg-white/10 transition-colors">用作(框)风格</button>
                                <div className="h-px bg-white/10 my-0.5 mx-2"></div>
                                <button onClick={() => { onUseAsMaterial(image); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-white hover:bg-white/10 transition-colors">用作(钮)材质</button>
                                <button onClick={() => { onSendToFont(image); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-white hover:bg-white/10 transition-colors">转到字体模式</button>
                            </div>
                        )}
                    </div>

                    <button onClick={() => onEdit(image)} className={`p-1 rounded transition-colors ${isList ? 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700' : 'hover:bg-white/20 text-white'}`} title="复用参数"><PencilIcon className="w-3.5 h-3.5"/></button>
                    <button onClick={() => onDelete(image.id)} className={`p-1 rounded transition-colors ${isList ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30' : 'hover:bg-red-500/40 text-red-200'}`} title="删除"><TrashIcon className="w-3.5 h-3.5"/></button>
                </div>
            </div>
        </div>
    );
};

const SkeletonCard: React.FC = () => (
    <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden relative">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-300/20 dark:via-slate-700/20 to-transparent"></div>
    </div>
);

const InitialState: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 opacity-50">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <SparklesIcon className="w-8 h-8 text-slate-400 dark:text-slate-600"/>
        </div>
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">等待生成结果</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500 max-w-xs">
            在左侧完成配置并点击生成
        </p>
    </div>
);

interface ResultsDisplayProps {
    images: GeneratedImage[];
    isLoading: boolean;
    onView: (image: GeneratedImage) => void;
    onEdit: (image: GeneratedImage) => void;
    onDelete: (id: string) => void;
    onModify: (image: GeneratedImage) => void;
    onEnhance: (image: GeneratedImage) => void;
    onDownloadAll: () => void;
    onSendToFont: (image: GeneratedImage) => void;
    onUseAsSource: (image: GeneratedImage, useAs: 'shape' | 'style') => void;
    onUseAsMaterial: (image: GeneratedImage) => void;
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

export const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(({
    images,
    isLoading,
    onView,
    onEdit,
    onDelete,
    onModify,
    onEnhance,
    onDownloadAll,
    onSendToFont,
    onUseAsSource,
    onUseAsMaterial,
    onHeaderMouseDown
}) => {
    const isInitialLoad = isLoading && images.length === 0;
    const [viewMode, setViewMode] = useState<'small' | 'large' | 'list'>('large');

    const getGridClass = () => {
        switch (viewMode) {
            case 'small': return 'grid-cols-3 gap-2';
            case 'large': return 'grid-cols-2 gap-3';
            case 'list': return 'grid-cols-1 gap-2';
            default: return 'grid-cols-2 gap-3';
        }
    };

    return (
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800 w-[550px] flex flex-col pointer-events-auto h-[700px]">
             <NodeHeader 
                number="03" 
                title="Output Gallery" 
                colorClass="bg-gradient-to-r from-emerald-500 to-teal-500"
                onMouseDown={onHeaderMouseDown}
            />
            
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                     <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">03</span>
                     <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">生成结果</h3>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                        <button 
                            onClick={() => setViewMode('small')} 
                            className={`p-1 rounded-md transition-colors ${viewMode === 'small' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="小图"
                        >
                            <Grid3x3Icon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('large')} 
                            className={`p-1 rounded-md transition-colors ${viewMode === 'large' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="大图"
                        >
                            <Grid2x2Icon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`p-1 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="列表"
                        >
                            <ListBulletIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {images.length > 0 && (
                        <button
                            onClick={onDownloadAll}
                            className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300 transition-colors"
                        >
                            <DownloadIcon className="w-3 h-3" />
                            <span className="hidden sm:inline">下载</span>
                        </button>
                    )}
                </div>
            </div>

            <ConnectionPort position="left" active={images.length > 0} />
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                {isInitialLoad ? (
                    <div className="grid grid-cols-2 gap-3">
                         <div className="col-span-2 text-center py-8">
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">AI 正在绘图...</p>
                         </div>
                        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : images.length === 0 ? (
                    <InitialState />
                ) : (
                    <div className={`grid ${getGridClass()} auto-rows-min`}>
                        {images.map(img => (
                            <ImageCard 
                                key={img.id} 
                                image={img} 
                                onView={onView} 
                                onEdit={onEdit} 
                                onDelete={onDelete} 
                                onModify={onModify}
                                onEnhance={onEnhance}
                                onSendToFont={onSendToFont}
                                onUseAsSource={onUseAsSource}
                                onUseAsMaterial={onUseAsMaterial}
                                viewMode={viewMode}
                            />
                        ))}
                         {isLoading && (
                            <div className={`flex items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg ${viewMode === 'list' ? 'col-span-1' : 'col-span-full'}`}>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <LoadingSpinner className="w-4 h-4" />
                                    <span className="text-xs">生成中...</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});
