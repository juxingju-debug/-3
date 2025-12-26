import React from 'react';
import { Theme } from '../types';
import { SparklesIcon, SunIcon, MoonIcon } from './Icons';

interface HeaderProps {
    theme: Theme;
    toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({ theme, toggleTheme }) => {
    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/80 dark:bg-slate-900/80">
            <div className="max-w-screen-2xl mx-auto">
                <div className="py-4 px-4 sm:px-6 lg:px-8">
                    <div className="relative flex items-center">
                        <div className="flex items-center gap-3">
                            <SparklesIcon className="h-8 w-8 text-brand-light dark:text-brand-dark" />
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                AI 图像风格化工具
                            </h1>
                        </div>
                        <div className="relative flex items-center ml-auto">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light dark:focus:ring-offset-slate-900"
                                aria-label="切换主题"
                            >
                                {theme === 'light' ? (
                                    <MoonIcon className="h-6 w-6" />
                                ) : (
                                    <SunIcon className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
});