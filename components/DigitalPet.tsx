import React, { useState, useEffect, useRef } from 'react';
import { chatWithPet } from '../services/geminiService';
import { LoadingSpinner, ArrowRightIcon } from './Icons';
import { GenerationParams, BackgroundOption, StyleOption } from '../types';

type PetType = 'fox' | 'cat' | 'dog' | 'mouse';

interface Message {
    role: 'user' | 'pet';
    text: string;
}

interface DigitalPetProps {
    appState?: {
        uiTheme: 'light' | 'dark';
        mode: string;
        genParams: GenerationParams;
    };
}

const DigitalPet: React.FC<DigitalPetProps> = ({ appState }) => {
    const [petType, setPetType] = useState<PetType>('fox');
    const [isHovered, setIsHovered] = useState(false);
    const [currentMessage, setCurrentMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [animationState, setAnimationState] = useState<'idle' | 'bounce' | 'shake'>('idle');

    // Auto greetings
    const greetings: Record<PetType, string[]> = {
        fox: ['Yip yip!', 'Looking sharp!', 'Need ideas?', 'I see you!'],
        cat: ['Meow.', 'Feed me?', 'Elegant choice.', 'Purr...'],
        dog: ['Bark!', 'Let\'s play!', 'Oh boy! Design!', 'Woof!'],
        mouse: ['Squeak!', 'Pixels look good.', 'Hello big giant!', 'Cheesy?'],
    };

    const handleHover = () => {
        setIsHovered(true);
        if (!isChatOpen && messages.length === 0) {
            const randomGreeting = greetings[petType][Math.floor(Math.random() * greetings[petType].length)];
            setCurrentMessage(randomGreeting);
            setTimeout(() => {
                if (!isChatOpen) setCurrentMessage('');
            }, 3000);
        }
    };

    const handleBodyClick = (part: 'head' | 'body') => {
        setAnimationState(part === 'head' ? 'bounce' : 'shake');
        
        let reaction = "";
        if (petType === 'fox') reaction = part === 'head' ? "My ears! Yip!" : "Tummy rub?";
        if (petType === 'cat') reaction = part === 'head' ? "Allowable." : "Don't touch the belly!";
        if (petType === 'dog') reaction = part === 'head' ? "Good boy am I?" : "Tail wagging!";
        if (petType === 'mouse') reaction = part === 'head' ? "Eek!" : "Tickles!";
        
        setCurrentMessage(reaction);
        setTimeout(() => setAnimationState('idle'), 500);
        setTimeout(() => {
             if (!isChatOpen) setCurrentMessage('');
        }, 2000);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isTyping) return;

        const newUserMsg: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, newUserMsg]);
        setInput('');
        setIsTyping(true);
        setIsChatOpen(true); // Ensure open
        
        try {
            // Convert internal message format to history format for service
            const history = messages.map(m => ({ role: m.role, text: m.text }));
            
            // Fallback appState if not provided
            const effectiveAppState = appState || {
                uiTheme: 'light',
                mode: 'unknown',
                genParams: {
                    theme: '',
                    style: StyleOption.DEFAULT,
                    background: BackgroundOption.TRANSPARENT,
                    aspectRatio: '1:1'
                } as GenerationParams
            };

            const response = await chatWithPet(petType, input, history, effectiveAppState);
            
            const newPetMsg: Message = { role: 'pet', text: response.text };
            setMessages(prev => [...prev, newPetMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'pet', text: 'Zzz... (Connection error)' }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Auto-scroll chat
    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatOpen]);

    const renderPetSVG = () => {
        const commonClasses = `w-20 h-20 transition-transform duration-300 cursor-pointer drop-shadow-lg filter`;
        const animClass = animationState === 'bounce' ? 'animate-bounce' : animationState === 'shake' ? 'animate-pulse' : 'animate-bounce-slow';

        switch (petType) {
            case 'fox':
                return (
                    <svg viewBox="0 0 100 100" className={`${commonClasses} ${animClass} text-orange-500`}>
                        <g onClick={() => handleBodyClick('body')}>
                            <path d="M20 70 Q50 100 80 70 L90 90 L10 90 Z" fill="currentColor" />
                            <circle cx="50" cy="85" r="15" fill="#FFF5E1" />
                        </g>
                        <g onClick={() => handleBodyClick('head')}>
                            <path d="M20 20 L50 65 L80 20 L50 40 Z" fill="currentColor" />
                            <path d="M20 20 L30 50 L50 40 Z" fill="#D97706" /> {/* Left Ear shadow */}
                            <path d="M80 20 L70 50 L50 40 Z" fill="#D97706" /> {/* Right Ear shadow */}
                            <circle cx="40" cy="50" r="3" fill="#1F2937" className={isTyping ? "animate-pulse" : ""} />
                            <circle cx="60" cy="50" r="3" fill="#1F2937" className={isTyping ? "animate-pulse" : ""} />
                            <circle cx="50" cy="58" r="4" fill="#1F2937" />
                        </g>
                    </svg>
                );
            case 'cat':
                return (
                    <svg viewBox="0 0 100 100" className={`${commonClasses} ${animClass} text-slate-500`}>
                        <g onClick={() => handleBodyClick('body')}>
                            <path d="M30 60 Q50 90 70 60 L80 90 L20 90 Z" fill="currentColor" />
                        </g>
                        <g onClick={() => handleBodyClick('head')}>
                            <path d="M20 20 L30 60 L70 60 L80 20 L50 30 Z" fill="currentColor" />
                            <circle cx="40" cy="45" r="4" fill="#FEF3C7" className={isTyping ? "animate-pulse" : ""} />
                            <circle cx="60" cy="45" r="4" fill="#FEF3C7" className={isTyping ? "animate-pulse" : ""} />
                            <path d="M48 52 L52 52 L50 55 Z" fill="#FCA5A5" />
                            <line x1="30" y1="48" x2="10" y2="45" stroke="#CBD5E1" strokeWidth="2" />
                            <line x1="30" y1="52" x2="10" y2="52" stroke="#CBD5E1" strokeWidth="2" />
                            <line x1="70" y1="48" x2="90" y2="45" stroke="#CBD5E1" strokeWidth="2" />
                            <line x1="70" y1="52" x2="90" y2="52" stroke="#CBD5E1" strokeWidth="2" />
                        </g>
                    </svg>
                );
            case 'dog':
                return (
                    <svg viewBox="0 0 100 100" className={`${commonClasses} ${animClass} text-amber-700`}>
                        <g onClick={() => handleBodyClick('body')}>
                            <ellipse cx="50" cy="75" rx="25" ry="20" fill="currentColor" />
                        </g>
                        <g onClick={() => handleBodyClick('head')}>
                            <circle cx="50" cy="45" r="25" fill="#D97706" />
                            <ellipse cx="25" cy="50" rx="10" ry="20" fill="#92400E" transform="rotate(-20 25 50)" /> {/* Ear */}
                            <ellipse cx="75" cy="50" rx="10" ry="20" fill="#92400E" transform="rotate(20 75 50)" /> {/* Ear */}
                            <circle cx="42" cy="40" r="4" fill="#FFF" />
                            <circle cx="42" cy="40" r="2" fill="#000" />
                            <circle cx="58" cy="40" r="4" fill="#FFF" />
                            <circle cx="58" cy="40" r="2" fill="#000" />
                            <path d="M45 52 Q50 58 55 52" stroke="#000" strokeWidth="2" fill="none" />
                            <ellipse cx="50" cy="48" rx="6" ry="4" fill="#1F2937" />
                        </g>
                    </svg>
                );
            case 'mouse':
                return (
                    <svg viewBox="0 0 100 100" className={`${commonClasses} ${animClass} text-neutral-400`}>
                        <g onClick={() => handleBodyClick('body')}>
                             <ellipse cx="50" cy="80" rx="20" ry="15" fill="currentColor" />
                        </g>
                        <g onClick={() => handleBodyClick('head')}>
                             <circle cx="30" cy="30" r="15" fill="currentColor" />
                             <circle cx="70" cy="30" r="15" fill="currentColor" />
                             <circle cx="30" cy="30" r="10" fill="#FCA5A5" />
                             <circle cx="70" cy="30" r="10" fill="#FCA5A5" />
                             <circle cx="50" cy="50" r="20" fill="currentColor" />
                             <circle cx="42" cy="45" r="2" fill="#000" />
                             <circle cx="58" cy="45" r="2" fill="#000" />
                             <circle cx="50" cy="55" r="3" fill="#FCA5A5" />
                        </g>
                    </svg>
                );
        }
    };

    return (
        <div className="fixed bottom-6 right-24 z-50 flex flex-col items-end pointer-events-auto">
            {/* Chat/Message Bubble */}
            {(isChatOpen || currentMessage) && (
                <div className={`mb-4 mr-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 w-64 origin-bottom-right transition-all animate-bounce-in flex flex-col ${isChatOpen ? 'h-80' : 'h-auto'}`}>
                    {/* Header with Close */}
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs font-bold text-slate-500 uppercase">{petType} Bot</span>
                        <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                    </div>

                    {/* Chat Area */}
                    {isChatOpen ? (
                        <>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-3 p-1">
                                {messages.length === 0 && (
                                    <div className="text-center text-xs text-slate-400 mt-4">
                                        Say hi to your pet!
                                    </div>
                                )}
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-lg p-2 text-xs ${
                                            m.role === 'user' 
                                            ? 'bg-brand-light text-white rounded-tr-none' 
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                                        }`}>
                                            {m.text}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2 rounded-tl-none">
                                            <LoadingSpinner className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Chat..."
                                    className="w-full pl-3 pr-8 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-full bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-brand-light"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-1 top-1 p-1 bg-brand-light text-white rounded-full hover:bg-opacity-90 disabled:opacity-50"
                                >
                                    <ArrowRightIcon className="w-3 h-3" />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                            {currentMessage}
                            <div className="mt-2 flex justify-end">
                                <button onClick={() => setIsChatOpen(true)} className="text-[10px] text-brand-light font-bold hover:underline">Chat</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Menu for switching pets */}
            <div className={`absolute bottom-full right-0 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1 flex-col gap-1 transition-all duration-300 ${isHovered ? 'flex opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-2'}`}>
                {(['fox', 'cat', 'dog', 'mouse'] as PetType[]).map(type => (
                    <button
                        key={type}
                        onClick={() => { setPetType(type); setMessages([]); }}
                        className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${petType === type ? 'bg-indigo-50 dark:bg-slate-700 text-brand-light' : 'text-slate-400'}`}
                        title={`Switch to ${type}`}
                    >
                        {type === 'fox' && '🦊'}
                        {type === 'cat' && '🐱'}
                        {type === 'dog' && '🐶'}
                        {type === 'mouse' && '🐭'}
                    </button>
                ))}
            </div>

            {/* Pet Avatar */}
            <div 
                className="relative"
                onMouseEnter={handleHover}
                onMouseLeave={() => setIsHovered(false)}
            >
               {renderPetSVG()}
            </div>
            
            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite;
                }
            `}</style>
        </div>
    );
};

export default DigitalPet;