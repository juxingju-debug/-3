
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { chatWithPet, PetAction } from '../services/geminiService';
import { GenerationParams, GenerationMode } from '../types';
import { RefreshIcon } from './Icons';

// --- 3D Models (Minecraft Villager Style) ---

const Voxel: React.FC<any> = (props) => (
    <mesh {...props}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={props.color} />
    </mesh>
);

const VillagerModel: React.FC<{ action: string }> = ({ action }) => {
    const group = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Group>(null);
    
    useFrame((state) => {
        if (!group.current || !headRef.current) return;
        
        const time = state.clock.elapsedTime;

        if (action === 'bounce') {
            // Happy jump / Yes / Talking
            group.current.position.y = Math.sin(time * 15) * 0.2;
            headRef.current.rotation.x = Math.sin(time * 15) * 0.1;
        } else if (action === 'no') {
            // Shake head / Deny
            headRef.current.rotation.y = Math.sin(time * 20) * 0.3;
        } else if (action === 'spin') {
            // Thinking / Trading
            group.current.rotation.y = Math.sin(time * 5) * 0.2; 
            headRef.current.rotation.z = Math.sin(time * 10) * 0.05; // Head tilt
        } else {
            // Idle breathing
            group.current.position.y = Math.sin(time * 2) * 0.05;
            // Occasional look around
            headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
        }
    });

    const skinColor = "#dfa076";
    const robeColor = "#5e3e28"; 
    const pantsColor = "#3d2618";
    const eyeColor = "#1a7c39"; // Emerald eyes

    return (
        <group ref={group} scale={0.75}>
            {/* Body (Robe) */}
            <Voxel position={[0, 0, 0]} color={robeColor} scale={[1, 2.5, 0.8]} />
            <Voxel position={[0, -1.3, 0]} color={pantsColor} scale={[0.9, 0.4, 0.7]} />
            
            {/* Head Group for rotation */}
            <group ref={headRef} position={[0, 1.75, 0]}>
                {/* Main Head Box */}
                <Voxel position={[0, 0, 0]} color={skinColor} scale={[1, 1.2, 1]} />
                
                {/* Nose (Big) */}
                <Voxel position={[0, -0.15, 0.6]} color={skinColor} scale={[0.25, 0.45, 0.25]} />
                
                {/* Unibrow */}
                <Voxel position={[0, 0.35, 0.51]} color="#3e2723" scale={[0.8, 0.15, 0.05]} />

                {/* Eyes */}
                <Voxel position={[-0.25, 0.15, 0.51]} color={eyeColor} scale={[0.15, 0.15, 0.05]} />
                <Voxel position={[0.25, 0.15, 0.51]} color={eyeColor} scale={[0.15, 0.15, 0.05]} />
                {/* Pupils */}
                <Voxel position={[-0.25, 0.15, 0.54]} color="#000" scale={[0.05, 0.05, 0.05]} />
                <Voxel position={[0.25, 0.15, 0.54]} color="#000" scale={[0.05, 0.05, 0.05]} />
            </group>

            {/* Arms (Crossed) */}
            <Voxel position={[0, 0.8, 0.5]} color={robeColor} scale={[1, 0.4, 0.4]} /> {/* Horizontal part */}
            <Voxel position={[-0.5, 0.8, 0.3]} color={robeColor} scale={[0.3, 0.8, 0.4]} /> {/* Left shoulder */}
            <Voxel position={[0.5, 0.8, 0.3]} color={robeColor} scale={[0.3, 0.8, 0.4]} /> {/* Right shoulder */}

            {/* Legs gap simulation */}
            <Voxel position={[0, -1.2, 0]} color="#1a1a1a" scale={[0.1, 1.5, 0.81]} /> 
        </group>
    );
};

// --- Advanced Villager Audio Synthesizer ---

const useVillagerAudio = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    const initAudio = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    };

    const playSound = useCallback((type: 'idle' | 'trade' | 'yes' | 'no' | 'mumble' | 'levelup') => {
        try {
            const ctx = initAudio();
            const t = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            // Villager Voice: Sawtooth with nasal filter
            osc.type = 'sawtooth';
            filter.type = 'bandpass';
            filter.frequency.value = 750; 
            filter.Q.value = 2.0;

            const pitchBase = 130 + Math.random() * 50; 

            switch (type) {
                case 'idle':
                    // Varied idle sounds
                    const r = Math.random();
                    if (r < 0.4) {
                        // "Hrrn." (Standard)
                        osc.frequency.setValueAtTime(pitchBase, t);
                        osc.frequency.linearRampToValueAtTime(pitchBase * 0.8, t + 0.3);
                        gain.gain.setValueAtTime(0, t);
                        gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                        osc.start(t); osc.stop(t + 0.45);
                    } else if (r < 0.7) {
                        // "Hmm?" (Inquisitive)
                        osc.frequency.setValueAtTime(pitchBase * 0.9, t);
                        osc.frequency.exponentialRampToValueAtTime(pitchBase * 1.3, t + 0.3);
                        gain.gain.setValueAtTime(0, t);
                        gain.gain.linearRampToValueAtTime(0.5, t + 0.1);
                        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
                        osc.start(t); osc.stop(t + 0.4);
                    } else {
                        // "Hr-hrm." (Double grunt)
                        osc.frequency.setValueAtTime(pitchBase, t);
                        gain.gain.setValueAtTime(0, t);
                        gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
                        gain.gain.linearRampToValueAtTime(0, t + 0.15);
                        
                        gain.gain.linearRampToValueAtTime(0.5, t + 0.25);
                        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                        osc.start(t); osc.stop(t + 0.45);
                    }
                    break;

                case 'trade':
                case 'mumble':
                    // "Hah..." (Longer processing sound)
                    osc.frequency.setValueAtTime(pitchBase, t);
                    osc.frequency.linearRampToValueAtTime(pitchBase * 1.1, t + 0.2);
                    osc.frequency.linearRampToValueAtTime(pitchBase * 0.9, t + 0.5);
                    
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.6, t + 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
                    
                    osc.start(t); osc.stop(t + 0.65);
                    break;

                case 'yes':
                case 'levelup':
                    // "Hah!" (Sharp, happy) or Bell-like for levelup
                    if (type === 'levelup') {
                        // Simulating a bell/chime + happy grunt
                        const bell = ctx.createOscillator();
                        const bellGain = ctx.createGain();
                        bell.type = 'sine';
                        bell.frequency.setValueAtTime(800, t);
                        bell.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
                        bellGain.gain.setValueAtTime(0, t);
                        bellGain.gain.linearRampToValueAtTime(0.3, t + 0.05);
                        bellGain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
                        bell.connect(bellGain); bellGain.connect(ctx.destination);
                        bell.start(t); bell.stop(t + 1);
                    }
                    
                    osc.frequency.setValueAtTime(pitchBase * 1.4, t);
                    osc.frequency.linearRampToValueAtTime(pitchBase * 1.6, t + 0.2);
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.7, t + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
                    osc.start(t); osc.stop(t + 0.35);
                    break;

                case 'no':
                    // "Hrr-hrr" (Negative, low)
                    osc.frequency.setValueAtTime(pitchBase * 0.8, t);
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.6, t + 0.05);
                    gain.gain.linearRampToValueAtTime(0.2, t + 0.15); // Dip
                    gain.gain.linearRampToValueAtTime(0.6, t + 0.25);
                    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                    osc.start(t); osc.stop(t + 0.45);
                    break;
            }
        } catch (e) {
            console.error("Audio synth error", e);
        }
    }, []);

    return playSound;
};

// --- TTS Hook ---
const useTTS = () => {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const updateVoices = () => {
            const vs = window.speechSynthesis.getVoices();
            setVoices(vs);
        };
        
        // Initial load
        updateVoices();
        
        // Chrome requires this event
        window.speechSynthesis.onvoiceschanged = updateVoices;
        
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const speak = useCallback((text: string, style: 'villager' | 'grumpy') => {
        if (!window.speechSynthesis) return;
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        
        if (style === 'grumpy') {
            // Updated settings for maximum GRUMPINESS
            // Rate > 1.0 = Fast/Impatient
            // Pitch < 1.0 = Deep/Gruff
            utter.rate = 1.4; 
            utter.pitch = 0.5; 
            
            // Heuristic for better Chinese voices if available
            // Prefer "Google", then "Microsoft", then any zh-CN
            const bestVoice = 
                voices.find(v => v.lang.includes('zh') && v.name.includes('Google')) ||
                voices.find(v => v.lang.includes('zh') && v.name.includes('Microsoft')) ||
                voices.find(v => v.lang.includes('zh'));
                
            if (bestVoice) utter.voice = bestVoice;
        }

        window.speechSynthesis.speak(utter);
    }, [voices]);

    return speak;
};

// --- Main Component ---

interface ThreeDPetProps {
    onCommand: (action: PetAction) => void;
    appState: {
        uiTheme: 'light' | 'dark';
        mode: string;
        genParams: GenerationParams;
    };
}

const GRUMPY_PHRASES = [
    "手怎么这么贱呢？",
    "你没事做吗？",
    "别戳了，烦死！",
    "有病去治，别戳我。",
    "再戳报警了啊！",
    "你是三岁小孩吗？",
    "没空理你！",
    "离我远点！",
    "闲得慌是吧？",
    "戳戳戳，戳个屁啊！",
    "莫挨老子！",
    "你很闲吗？去工作！"
];

const ThreeDPet: React.FC<ThreeDPetProps> = ({ onCommand, appState }) => {
    const [action, setAction] = useState<string>('idle');
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [mode, setMode] = useState<'design' | 'chat'>('design'); 
    
    // Position state for drag
    const [position, setPosition] = useState({ x: window.innerWidth - 180, y: window.innerHeight - 300 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const petContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const playSound = useVillagerAudio();
    const speak = useTTS();

    // Auto-scroll chat
    useEffect(() => {
        if (chatOpen && messagesEndRef.current) {
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            });
        }
    }, [messages, chatOpen]);

    // Random idle sounds (only in design mode)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!chatOpen && Math.random() < 0.05 && mode === 'design') {
                playSound('idle');
                setAction('idle');
            }
        }, 8000);
        return () => clearInterval(interval);
    }, [chatOpen, playSound, mode]);

    // Handle Dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('.chat-content')) {
            return;
        }
        e.stopPropagation(); 
        setIsDragging(true);
        if (petContainerRef.current) {
            const rect = petContainerRef.current.getBoundingClientRect();
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("您的浏览器不支持语音识别，请尝试使用 Chrome。");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN'; 
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            handleSendMessage(transcript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleClearMemory = () => {
        setMessages([]);
        if (mode === 'design') {
            playSound('mumble');
        } else {
             speak("记忆清除了，别再烦我以前的事。", 'grumpy');
        }
    };

    const handleSendMessage = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
        setInput('');
        setChatOpen(true);
        setAction('spin'); 
        
        // Play thinking sound only in design mode, stay silent in chat (listening)
        if (mode === 'design') {
            playSound('mumble'); 
        }

        try {
            const history = messages.map(m => ({ role: m.role, text: m.text }));
            const response = await chatWithPet(mode === 'design' ? 'villager' : 'grumpy', textToSend, history, appState, mode);
            
            setMessages(prev => [...prev, { role: 'pet', text: response.text }]);
            
            if (mode === 'chat') {
                // Grumpy Brother speaks
                setAction('bounce');
                speak(response.text, 'grumpy');
            } else {
                // Design Mode: Villager acts
                if (response.action && response.action.type !== 'NONE') {
                    playSound('levelup');
                    setAction('bounce');
                    onCommand(response.action);
                } else {
                    playSound('idle');
                    setAction('idle');
                }
            }
        } catch (e) {
            console.error(e);
            if (mode === 'design') playSound('no');
            setAction('no');
            setMessages(prev => [...prev, { role: 'pet', text: "Hrrn... (Error)" }]);
        } finally {
            if (mode === 'design') {
                setTimeout(() => setAction('idle'), 2000);
            } else {
                // Grumpy keeps moving a bit longer while speaking, then stops
                 setTimeout(() => setAction('idle'), 4000);
            }
        }
    };

    const handlePetClick = () => {
        setChatOpen(true);
        if (mode === 'design') {
            setAction('bounce');
            playSound('yes');
        } else {
            // GRUMPY MODE CLICK INTERACTION
            const phrase = GRUMPY_PHRASES[Math.floor(Math.random() * GRUMPY_PHRASES.length)];
            setAction('no'); // Shake head in annoyance
            speak(phrase, 'grumpy');
            setTimeout(() => setAction('idle'), 2000);
        }
    };

    return (
        <div 
            ref={petContainerRef}
            className={`fixed z-50 pointer-events-auto flex flex-col items-center select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ left: position.x, top: position.y }}
            onMouseDown={handleMouseDown}
        >
            
            {/* Chat Bubble - Updated to use slate/white theme consistently */}
            {chatOpen && (
                <div 
                    className="absolute bottom-full mb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 rounded-lg shadow-2xl border-4 border-slate-300 dark:border-slate-700 w-72 flex flex-col origin-bottom animate-bounce-in"
                    style={{ imageRendering: 'pixelated' }} 
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-2 border-b-2 border-slate-200 dark:border-slate-700 pb-2">
                         <span className="font-bold text-xs uppercase text-emerald-700 dark:text-emerald-500 flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${mode === 'design' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                                <span>{mode === 'design' ? 'Villager Designer' : '暴躁老哥'}</span>
                        </span>
                        <div className="flex gap-2 items-center">
                            <button 
                                onClick={handleClearMemory}
                                className="text-slate-400 hover:text-emerald-500 transition-colors p-1"
                                title="清空记忆/新话题"
                            >
                                <RefreshIcon className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => setMode(m => m === 'design' ? 'chat' : 'design')}
                                className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 transition-colors text-slate-600 dark:text-slate-300"
                            >
                                {mode === 'design' ? '切换闲聊' : '切换设计'}
                            </button>
                            <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-red-500 font-bold px-1">×</button>
                        </div>
                    </div>
                    
                    <div className="chat-content h-48 overflow-y-auto custom-scrollbar mb-3 space-y-3 pr-1">
                        {messages.length === 0 && (
                            <div className="text-center text-xs text-slate-400 mt-10 italic">
                                {mode === 'design' ? 'Hrrn... (告诉我你想改什么)' : '切... (有事说事，没事退朝)'}
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`text-xs px-3 py-2 rounded-lg max-w-[85%] leading-relaxed shadow-sm font-medium ${
                                    m.role === 'user' 
                                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>

                    <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800 p-1 border-2 border-slate-300 dark:border-slate-600 rounded">
                        <input 
                            className="flex-1 bg-transparent text-xs px-2 py-1 focus:outline-none text-slate-700 dark:text-slate-200" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={mode === 'design' ? "告诉我要改什么..." : "跟老哥聊聊..."}
                        />
                        <button 
                            onClick={() => handleSendMessage()} 
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-sm text-white shadow-sm transition-colors"
                        >
                            <svg className="w-3.5 h-3.5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* 3D Scene Container */}
            <div className="relative w-40 h-40 group">
                
                <div className={`absolute inset-0 backdrop-blur-sm rounded-full border-2 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-300 ${mode === 'design' ? 'bg-slate-800/20 border-emerald-500/30' : 'bg-orange-900/20 border-orange-500/30'}`}>
                     <div className={`absolute bottom-0 w-full h-1/2 bg-gradient-to-t opacity-50 ${mode === 'design' ? 'from-emerald-500/10' : 'from-orange-500/10'} to-transparent`}></div>
                </div>

                <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded pointer-events-none whitespace-nowrap">
                    按住拖动
                </div>

                <div className="absolute inset-0 cursor-pointer" onClick={handlePetClick}>
                    <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
                        <ambientLight intensity={0.9} />
                        <pointLight position={[10, 10, 10]} intensity={1.5} />
                        <spotLight position={[-10, 10, -5]} intensity={1} />
                        
                        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                            <VillagerModel action={action} />
                        </Float>
                        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
                    </Canvas>
                </div>

                <div className="absolute -bottom-8 w-full flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" onMouseDown={(e) => e.stopPropagation()}>
                    {mode === 'design' && (
                        <button 
                            onClick={() => playSound('idle')}
                            className="p-2 bg-slate-100 dark:bg-slate-800 rounded shadow-lg border-2 border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform text-slate-600 dark:text-slate-300 font-bold text-xs"
                            title="Hrrn"
                        >
                            Hrrn
                        </button>
                    )}
                     {mode === 'chat' && (
                        <button 
                            onClick={() => speak('你烦不烦啊？', 'grumpy')}
                            className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded shadow-lg border-2 border-orange-300 dark:border-orange-600 hover:scale-110 transition-transform text-orange-600 dark:text-orange-300 font-bold text-xs"
                            title="Test Voice"
                        >
                            🔊
                        </button>
                    )}
                    <button 
                        onClick={toggleListening}
                        className={`p-2 rounded shadow-lg border-2 border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform ${isListening ? 'bg-red-500 text-white animate-pulse border-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                        title="语音指令"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThreeDPet;
