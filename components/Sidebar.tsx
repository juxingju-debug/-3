
import React from 'react';
import { GenerationMode, Theme } from '../types';
import { 
    FrameIcon, 
    PhotoIcon, 
    BackgroundIcon, 
    FontIcon, 
    PuzzleIcon,
    SunIcon,
    MoonIcon,
    SparklesIcon
} from './Icons';

interface SidebarProps {
    currentMode: GenerationMode;
    onModeChange: (mode: GenerationMode) => void;
    theme: Theme;
    toggleTheme: () => void;
}

const NavItem: React.FC<{ 
    isActive: boolean; 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string 
}> = ({ isActive, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`relative group flex items-center justify-center p-3 rounded-xl transition-all duration-300
            ${isActive 
                ? 'bg-brand-light text-white shadow-lg shadow-brand-light/40 dark:bg-brand-dark dark:text-slate-900 dark:shadow-brand-dark/20 scale-105' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }
        `}
    >
        {icon}
        
        {/* Tooltip */}
        <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {label}
        </div>
    </button>
);

export const Sidebar: React.FC<SidebarProps> = React.memo(({ currentMode, onModeChange, theme, toggleTheme }) => {
    return (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-6">
             {/* Main Navigation Dock */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-2xl rounded-2xl p-2 flex flex-col gap-2">
                 <div className="w-10 h-10 mx-auto bg-gradient-to-br from-brand-light to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-light/20 mb-2">
                    <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                
                <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-1"></div>

                <NavItem 
                    isActive={currentMode === GenerationMode.FRAME} 
                    onClick={() => onModeChange(GenerationMode.FRAME)} 
                    icon={<FrameIcon className="w-5 h-5" />} 
                    label="画框生成" 
                />
                <NavItem 
                    isActive={currentMode === GenerationMode.PHOTO} 
                    onClick={() => onModeChange(GenerationMode.PHOTO)} 
                    icon={<PhotoIcon className="w-5 h-5" />} 
                    label="场景变换" 
                />
                <NavItem 
                    isActive={currentMode === GenerationMode.BACKGROUND} 
                    onClick={() => onModeChange(GenerationMode.BACKGROUND)} 
                    icon={<BackgroundIcon className="w-5 h-5" />} 
                    label="背景生成" 
                />
                <NavItem 
                    isActive={currentMode === GenerationMode.FONT} 
                    onClick={() => onModeChange(GenerationMode.FONT)} 
                    icon={<FontIcon className="w-5 h-5" />} 
                    label="字体设计" 
                />
                <NavItem 
                    isActive={currentMode === GenerationMode.ELEMENT} 
                    onClick={() => onModeChange(GenerationMode.ELEMENT)} 
                    icon={<PuzzleIcon className="w-5 h-5" />} 
                    label="元素装饰" 
                />
            </div>

            {/* Theme Toggle Dock */}
             <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl rounded-full p-1.5">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
                >
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
});