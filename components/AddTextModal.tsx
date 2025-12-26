import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { LoadingSpinner } from './Icons';
import { fontLibrary } from '../utils/fonts';

interface AddTextModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddText: (text: string, fontDescription: string, color: string, position: '顶部' | '中部' | '底部') => Promise<void>;
    isProcessing: boolean;
}

const AddTextModal: React.FC<AddTextModalProps> = ({ isOpen, onClose, onAddText, isProcessing }) => {
    const [text, setText] = useState('输入文字');
    const [color, setColor] = useState('#FFFFFF');
    const [position, setPosition] = useState<'顶部' | '中部' | '底部'>('中部');
    const [selectedCategory, setSelectedCategory] = useState(fontLibrary[0].name);
    const [selectedFont, setSelectedFont] = useState(fontLibrary[0].fonts[0].description);

    const availableFonts = useMemo(() => {
        return fontLibrary.find(cat => cat.name === selectedCategory)?.fonts || [];
    }, [selectedCategory]);

    const handleApply = () => {
        if (!text.trim()) {
            alert('请输入要添加的文字。');
            return;
        }
        onAddText(text, selectedFont, color, position);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="添加艺术文字">
            {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-48">
                    <LoadingSpinner className="w-12 h-12 text-brand-light dark:text-brand-dark" />
                    <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">AI 正在创作文字艺术...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="add-text-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">文字内容</label>
                        <input
                            id="add-text-input"
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                        />
                    </div>
                    <div>
                        <label htmlFor="font-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">字体风格</label>
                        <select
                            id="font-category"
                            value={selectedCategory}
                            onChange={e => {
                                setSelectedCategory(e.target.value);
                                const newCategory = fontLibrary.find(cat => cat.name === e.target.value);
                                if (newCategory && newCategory.fonts.length > 0) {
                                    setSelectedFont(newCategory.fonts[0].description);
                                }
                            }}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                        >
                            {fontLibrary.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="font-style" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">具体样式</label>
                        <select
                            id="font-style"
                            value={selectedFont}
                            onChange={e => setSelectedFont(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                        >
                            {availableFonts.map(font => <option key={font.name} value={font.description}>{font.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="text-color" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">主色调</label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="text-color"
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="p-1 h-10 w-10 block bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 cursor-pointer rounded-md"
                                />
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">位置</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['顶部', '中部', '底部'] as const).map(pos => (
                                    <button
                                        key={pos}
                                        onClick={() => setPosition(pos)}
                                        className={`px-3 py-2 text-sm rounded-md border transition-colors ${position === pos ? 'bg-brand-light text-white border-brand-light dark:bg-brand-dark dark:text-slate-900 dark:border-brand-dark' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-brand-light dark:hover:border-brand-dark'}`}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-4 py-2 bg-brand-light text-white rounded-lg hover:bg-opacity-90 dark:bg-brand-dark dark:text-slate-900 transition-colors"
                        >
                            应用并生成
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default React.memo(AddTextModal);
