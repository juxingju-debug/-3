
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { BackgroundOption, GeneratedImage, GenerationParams, StyleOption, GenerationMode, ButtonMaterialOption } from './types';
import { generateImages, generateBackgroundForProduct, expandThemePrompt, generatePropsForProduct, generatePropsForTheme, modifyImage, upscaleImage, sharpenImage, modifyTextInImage, restyleTextInImage, generateFontImages, generateElementImages, generateElementsForTheme, extractElementsFromImage, restyleFrame, restyleBubbleFrame, restyleButton, removeTextFromImage, createBlankCanvasFile, PetAction } from './services/geminiService';
import { Sidebar } from './components/Sidebar';
import { InputNode, SettingsNode } from './components/ControlPanel';
import { ResultsDisplay } from './components/ResultsDisplay';
import Modal from './components/Modal';
import FrameLibraryModal from './components/FrameLibraryModal';
import ModifyImageModal from './components/ModifyImageModal';
import EnhanceImageModal from './components/EnhanceImageModal';
import CropModal from './components/CropModal';
import ThreeDPet from './components/ThreeDPet';
import { DownloadIcon, XMarkIcon, FitToScreenIcon, LockIcon, UnlockIcon } from './components/Icons';
import { useFrameLibrary } from './hooks/useFrameLibrary';
import { dataURLtoFile, fileToDataURL, padImageToAspectRatio } from './utils/fileUtils';

const INITIAL_GEN_PARAMS: GenerationParams = {
    theme: '赛博朋克',
    elements: '',
    props: '',
    color: '#4f46e5',
    useColor: true,
    background: BackgroundOption.TRANSPARENT,
    negativePrompt: '',
    style: StyleOption.VECTOR,
    productThemeLock: false,
    fontText: '艺术字',
    fontMode: 'generate-restyle',
    elementMode: 'elements',
    buttonMode: 'generate',
    buttonMaterial: ButtonMaterialOption.FLAT,
    elementMaterial: ButtonMaterialOption.FLAT,
    fontMaterial: ButtonMaterialOption.FLAT,
    useFontMaterial: true,
    variationLevel: 68,
    aspectRatio: 'source',
    frameMode: 'generate',
    frameShapeStrategy: 'dynamic',
};

const EMPTY_GEN_PARAMS: GenerationParams = {
    theme: '',
    elements: '',
    props: '',
    color: '#4f46e5',
    useColor: false,
    background: BackgroundOption.TRANSPARENT,
    negativePrompt: '',
    style: StyleOption.VECTOR,
    productThemeLock: false,
    fontText: '',
    fontMode: 'generate-restyle',
    elementMode: 'elements',
    buttonMode: 'generate',
    buttonMaterial: ButtonMaterialOption.FLAT,
    elementMaterial: ButtonMaterialOption.FLAT,
    fontMaterial: ButtonMaterialOption.FLAT,
    useFontMaterial: false,
    variationLevel: 68,
    aspectRatio: '16:9',
    frameMode: 'generate',
    frameShapeStrategy: 'dynamic',
};

interface NodePosition {
    x: number;
    y: number;
}

const DynamicConnectionLine: React.FC<{ 
    start: { x: number; y: number }; 
    end: { x: number; y: number }; 
}> = ({ start, end }) => {
    // Control points for Bezier curve
    const dist = Math.abs(end.x - start.x);
    const cp1 = { x: start.x + dist * 0.5, y: start.y };
    const cp2 = { x: end.x - dist * 0.5, y: end.y };
    
    const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

    return (
        <>
            <path 
                d={path} 
                fill="none" 
                stroke="currentColor" 
                className="text-slate-300 dark:text-slate-700" 
                strokeWidth="4"
            />
            <path 
                d={path} 
                fill="none" 
                stroke="currentColor" 
                className="text-emerald-400 opacity-60 animate-flow" 
                strokeWidth="3"
                strokeDasharray="12"
            />
        </>
    );
};

const App: React.FC = () => {
    const [theme, setTheme, toggleTheme] = useTheme();

    // Canvas State
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
    const [isCanvasLocked, setIsCanvasLocked] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Node Positions State
    const [nodePositions, setNodePositions] = useState<{ [key: string]: NodePosition }>({
        input: { x: 100, y: 200 },
        settings: { x: 600, y: 200 },
        results: { x: 1100, y: 150 },
    });

    // App State
    const [originalImages, setOriginalImages] = useState<File[]>([]);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImageProcessing, setIsImageProcessing] = useState(false);
    const [isRemovingText, setIsRemovingText] = useState(false);
    const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
    const [isGeneratingProps, setIsGeneratingProps] = useState(false);
    const [isGeneratingThemeProps, setIsGeneratingThemeProps] = useState(false);
    const [isGeneratingElements, setIsGeneratingElements] = useState(false);
    const [isExpandingTheme, setIsExpandingTheme] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [imageToModify, setImageToModify] = useState<GeneratedImage | null>(null);
    const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
    const [imageToEnhance, setImageToEnhance] = useState<GeneratedImage | null>(null);
    const [generationMode, setGenerationMode] = useState<GenerationMode>(GenerationMode.FRAME);
    const [fontSourceImage, setFontSourceImage] = useState<File[]>([]);
    const [fontStyleSourceImage, setFontStyleSourceImage] = useState<File[]>([]); 
    const [frameStyleSourceImage, setFrameStyleSourceImage] = useState<File[]>([]);
    const [buttonStyleSourceImage, setButtonStyleSourceImage] = useState<File[]>([]);
    
    // Cropping State
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<{file: File, index: number, uploader: string} | null>(null);

    // Create a ref to hold the current image states for the stable callback
    const imageFilesRef = useRef({ originalImages, fontSourceImage, fontStyleSourceImage, frameStyleSourceImage, buttonStyleSourceImage });
    imageFilesRef.current = { originalImages, fontSourceImage, fontStyleSourceImage, frameStyleSourceImage, buttonStyleSourceImage };


    // Frame Library
    const { templates, addTemplate, deleteTemplate, isFull: isLibraryFull, exportTemplates, importTemplates } = useFrameLibrary();


    // Generation parameters
    const [genParams, setGenParams] = useState<GenerationParams>(INITIAL_GEN_PARAMS);
    const [count, setCount] = useState(1);

    // Canvas Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (e: WheelEvent) => {
            if (isCanvasLocked) return;
            e.preventDefault();

            // Sensitivity for zooming
            const zoomSensitivity = 0.001; 
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(0.2, scale + delta), 5); // Allow zoom up to 5x

            if (newScale === scale) return;

            const rect = canvas.getBoundingClientRect();
            // Mouse position relative to the canvas container
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - position.x) / scale;
            const worldY = (mouseY - position.y) / scale;

            const newX = mouseX - worldX * newScale;
            const newY = mouseY - worldY * newScale;

            setScale(newScale);
            setPosition({ x: newX, y: newY });
        };

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        }
    }, [scale, position, isCanvasLocked]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isCanvasLocked) return;
        // If left click on background or middle click anywhere
        if ((e.button === 0 && (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('bg-dot-pattern'))) || e.button === 1) {
            e.preventDefault();
            setIsDraggingCanvas(true);
            setLastMousePosition({ x: e.clientX, y: e.clientY });
        }
    };

    const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
        if (isCanvasLocked) return;
        e.stopPropagation(); // Prevent canvas dragging
        e.preventDefault();
        setDraggingNode(nodeId);
        setLastMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDraggingCanvas) {
            const dx = e.clientX - lastMousePosition.x;
            const dy = e.clientY - lastMousePosition.y;
            setPosition({ x: position.x + dx, y: position.y + dy });
            setLastMousePosition({ x: e.clientX, y: e.clientY });
        } else if (draggingNode) {
            const dx = (e.clientX - lastMousePosition.x) / scale;
            const dy = (e.clientY - lastMousePosition.y) / scale;
            
            setNodePositions(prev => ({
                ...prev,
                [draggingNode]: {
                    x: prev[draggingNode].x + dx,
                    y: prev[draggingNode].y + dy
                }
            }));
            setLastMousePosition({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDraggingCanvas(false);
        setDraggingNode(null);
    };
    
    const handleFitToScreen = () => {
        setScale(0.8);
        setPosition({ x: 0, y: 0 });
        setNodePositions({
            input: { x: 100, y: 200 },
            settings: { x: 600, y: 200 },
            results: { x: 1100, y: 150 },
        });
    };

    const handleGenerate = useCallback(async () => {
        // Centralized checks for input requirements
        if (generationMode === GenerationMode.FRAME && (genParams.frameMode === 'restyle' || genParams.frameMode === 'bubble')) {
            if (originalImages.length === 0 || frameStyleSourceImage.length === 0) {
                 setError('请同时上传画框模板/轮廓和风格源图片。');
                 return;
            }
        } else if (generationMode === GenerationMode.FRAME && genParams.frameMode === 'generate') {
            if (originalImages.length === 0 && !genParams.theme.trim()) {
                setError('请至少输入主题描述，或上传一张画框作为参考。');
                return;
            }
        } else if (generationMode === GenerationMode.FONT) {
             if (genParams.fontMode === 'generate-restyle') {
                if (fontSourceImage.length === 0 && !genParams.fontText.trim()) {
                    setError('请输入要生成的文字，或上传一张文字图片。');
                    return;
                }
            } else if (genParams.fontMode === 'bubble') {
                if (!genParams.fontText.trim()) {
                    setError('请输入要生成的文字。');
                    return;
                }
            } else if (genParams.fontMode === 'modify') {
                if (fontSourceImage.length === 0) {
                     setError('请上传一张包含文字的图片以进行修改。');
                     return;
                }
                if (!genParams.fontText.trim()) {
                    setError('请输入要替换的文本。');
                    return;
                }
            }
        } else if (generationMode === GenerationMode.ELEMENT) {
            if (genParams.elementMode === 'button') {
                if (genParams.buttonMode === 'restyle') {
                    if (originalImages.length === 0 || buttonStyleSourceImage.length === 0) {
                        setError('请同时上传按钮形状和材质图片。');
                        return;
                    }
                } else if (originalImages.length === 0) { // generate mode
                    setError('请上传一个按钮边框或者色块。');
                    return;
                }
            } else if (genParams.elementMode === 'background') {
                if (originalImages.length === 0) {
                    setError('请上传一张图片以提取元素。');
                    return;
                }
            } else if (genParams.elementMode === 'elements') {
                 if (!genParams.theme.trim()) {
                    setError('请输入要生成元素的主题。');
                    return;
                }
            }
        } else if (generationMode !== GenerationMode.FRAME && originalImages.length === 0) { 
            setError('请先上传一张或多张图片。');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const isBatchMode = generationMode === GenerationMode.PHOTO && originalImages.length > 1;
            const colorToUse = genParams.useColor ? genParams.color : '';
            const needsPadding = (genParams.aspectRatio && genParams.aspectRatio !== 'source') &&
                                 (generationMode === GenerationMode.PHOTO || generationMode === GenerationMode.BACKGROUND);

            if (isBatchMode) {
                const allSourceUrls = await Promise.all(originalImages.map(fileToDataURL));
                for (let i = 0; i < originalImages.length; i++) {
                    const imageFile = originalImages[i];
                    const sourceImageUrl = allSourceUrls[i];
                    try {
                        const imageToProcess = needsPadding ? await padImageToAspectRatio(imageFile, genParams.aspectRatio!) : imageFile;

                        const newImageUrls = await generateImages({
                            imageFile: imageToProcess,
                            theme: genParams.theme,
                            elements: genParams.elements,
                            props: genParams.props,
                            color: colorToUse,
                            background: genParams.background,
                            negativePrompt: genParams.negativePrompt,
                            style: genParams.style,
                            count: 1, 
                            mode: generationMode,
                            productThemeLock: genParams.productThemeLock,
                            variationLevel: genParams.variationLevel,
                            aspectRatio: genParams.aspectRatio,
                        });

                        if (newImageUrls.length > 0) {
                            const newImage: GeneratedImage = {
                                id: crypto.randomUUID(),
                                imageUrl: newImageUrls[0],
                                params: { ...genParams },
                                mode: generationMode,
                                sourceImageUrl: sourceImageUrl,
                                batchSourceImageUrls: allSourceUrls,
                            };
                            setGeneratedImages(prev => [...prev, newImage]);
                        }
                    } catch (batchError) {
                        console.error(`Error processing image ${i + 1}/${originalImages.length}:`, batchError);
                        const message = batchError instanceof Error ? batchError.message : String(batchError);
                        setError(`处理第 ${i + 1} 张图片时出错: ${message}`);
                        break;
                    }
                }
            } else if (generationMode === GenerationMode.FONT) {
                if (genParams.fontMode === 'generate-restyle' || genParams.fontMode === 'bubble') {
                    if (fontSourceImage.length > 0 && genParams.fontMode === 'generate-restyle') {
                        const sourceImageFile = fontSourceImage[0];
                        const sourceImageUrl = await fileToDataURL(sourceImageFile);
                        const newImageUrl = await restyleTextInImage(
                            sourceImageFile,
                            genParams.theme,
                            colorToUse,
                            genParams.style,
                            genParams.negativePrompt
                        );
                        const newImage: GeneratedImage = {
                            id: crypto.randomUUID(),
                            imageUrl: newImageUrl,
                            params: { ...genParams },
                            mode: generationMode,
                            sourceImageUrl: sourceImageUrl,
                        };
                        setGeneratedImages(prev => [...prev, newImage]);
                    } else {
                        let effectiveAspectRatio = genParams.aspectRatio;
                        if (!effectiveAspectRatio || effectiveAspectRatio === 'source') {
                            effectiveAspectRatio = '16:9';
                        }
                        
                        const styleRefFile = fontStyleSourceImage.length > 0 ? fontStyleSourceImage[0] : undefined;
                        const styleRefUrl = styleRefFile ? await fileToDataURL(styleRefFile) : undefined;

                        const newImageUrls = await generateFontImages(
                            genParams.fontText,
                            genParams.theme,
                            colorToUse,
                            genParams.style,
                            genParams.negativePrompt,
                            count,
                            genParams.background,
                            genParams.fontMode,
                            genParams.variationLevel, // Pass as intensity
                            genParams.useFontMaterial ? genParams.fontMaterial : undefined,
                            effectiveAspectRatio,
                            styleRefFile 
                        );
                        const newImages: GeneratedImage[] = newImageUrls.map(url => ({
                            id: crypto.randomUUID(),
                            imageUrl: url,
                            params: { ...genParams, aspectRatio: effectiveAspectRatio },
                            mode: generationMode,
                            sourceImageUrl: '', 
                            fontStyleImageUrl: styleRefUrl
                        }));
                        setGeneratedImages(prev => [...prev, ...newImages]);
                    }
                } else { 
                    const sourceImageFile = fontSourceImage[0];
                    const sourceImageUrl = await fileToDataURL(sourceImageFile);
                    const newImageUrl = await modifyTextInImage(sourceImageFile, genParams.fontText);
                    const newImage: GeneratedImage = {
                        id: crypto.randomUUID(),
                        imageUrl: newImageUrl,
                        params: { ...genParams },
                        mode: generationMode,
                        sourceImageUrl: sourceImageUrl,
                    };
                    setGeneratedImages(prev => [...prev, newImage]);
                }
            } else if (generationMode === GenerationMode.ELEMENT) {
                if (genParams.elementMode === 'button') {
                    if (genParams.buttonMode === 'restyle') {
                        const shapeImageFile = originalImages[0];
                        const styleImageFile = buttonStyleSourceImage[0];
                        const sourceImageUrl = await fileToDataURL(shapeImageFile);
                        const styleImageUrl = await fileToDataURL(styleImageFile);

                        const newImageUrls = await Promise.all(
                            Array(count).fill(0).map(() => restyleButton(styleImageFile, shapeImageFile, genParams.background))
                        );

                        const newImages: GeneratedImage[] = newImageUrls.map(url => ({
                            id: crypto.randomUUID(),
                            imageUrl: url,
                            params: { ...genParams },
                            mode: generationMode,
                            sourceImageUrl: sourceImageUrl,
                            buttonStyleImageUrl: styleImageUrl,
                        }));
                        setGeneratedImages(prev => [...prev, ...newImages]);
                    } else { 
                        const sourceImageFile = originalImages[0];
                        const sourceImageUrl = await fileToDataURL(sourceImageFile);
                        const newImageUrls = await generateImages({
                            imageFile: sourceImageFile,
                            theme: genParams.theme,
                            elements: genParams.elements,
                            props: genParams.props,
                            color: colorToUse,
                            background: genParams.background,
                            negativePrompt: genParams.negativePrompt,
                            style: genParams.style,
                            count: count,
                            mode: generationMode,
                            productThemeLock: genParams.productThemeLock,
                            elementMode: genParams.elementMode,
                            buttonMaterial: genParams.buttonMaterial,
                            variationLevel: genParams.variationLevel
                        });
                        const newImages: GeneratedImage[] = newImageUrls.map(url => ({
                            id: crypto.randomUUID(),
                            imageUrl: url,
                            params: { ...genParams },
                            mode: generationMode,
                            sourceImageUrl: sourceImageUrl,
                        }));
                        setGeneratedImages(prev => [...prev, ...newImages]);
                    }
                } else if (genParams.elementMode === 'background') {
                    const sourceImageFile = originalImages[0];
                    const sourceImageUrl = await fileToDataURL(sourceImageFile);
                    const newImageUrls = await extractElementsFromImage(sourceImageFile, count);
                    const newImages: GeneratedImage[] = newImageUrls.map(url => ({
                        id: crypto.randomUUID(),
                        imageUrl: url,
                        params: { ...genParams },
                        mode: generationMode,
                        sourceImageUrl: sourceImageUrl,
                    }));
                    setGeneratedImages(prev => [...prev, ...newImages]);
                } else {
                    const newImageUrls = await generateElementImages(
                            genParams.theme,
                            colorToUse,
                            genParams.style,
                            genParams.negativePrompt,
                            count,
                            genParams.elementMaterial
                        );
                    const newImages: GeneratedImage[] = newImageUrls.map(url => ({
                        id: crypto.randomUUID(),
                        imageUrl: url,
                        params: { ...genParams },
                        mode: generationMode,
                        sourceImageUrl: '', 
                    }));
                    setGeneratedImages(prev => [...prev, ...newImages]);
                }
            } else if (generationMode === GenerationMode.FRAME && genParams.frameMode === 'bubble') {
                const outlineImageFile = originalImages[0];
                const aestheticImageFile = frameStyleSourceImage[0];
                const sourceImageUrl = await fileToDataURL(outlineImageFile);
                const styleImageUrl = await fileToDataURL(aestheticImageFile);

                const newImageUrls = await Promise.all(
                    Array(count).fill(0).map(() => restyleBubbleFrame(aestheticImageFile, outlineImageFile, genParams.variationLevel, genParams.background, genParams.style))
                );

                const newImages: GeneratedImage[] = newImageUrls.map(url => ({
                    id: crypto.randomUUID(),
                    imageUrl: url,
                    params: { ...genParams },
                    mode: generationMode,
                    sourceImageUrl: sourceImageUrl,
                    frameStyleImageUrl: styleImageUrl,
                }));
                setGeneratedImages(prev => [...prev, ...newImages]);
            } else if (generationMode === GenerationMode.FRAME && genParams.frameMode === 'restyle') {
                const shapeImageFile = originalImages[0];
                const aestheticImageFile = frameStyleSourceImage[0];
                const sourceImageUrl = await fileToDataURL(shapeImageFile);
                const styleImageUrl = await fileToDataURL(aestheticImageFile);

                const newImageUrls = await Promise.all(
                    Array(count).fill(0).map(() => restyleFrame(aestheticImageFile, shapeImageFile, genParams.variationLevel, genParams.background))
                );

                const newImages: GeneratedImage[] = newImageUrls.map(url => ({
                    id: crypto.randomUUID(),
                    imageUrl: url,
                    params: { ...genParams },
                    mode: generationMode,
                    sourceImageUrl: sourceImageUrl,
                    frameStyleImageUrl: styleImageUrl,
                }));
                setGeneratedImages(prev => [...prev, ...newImages]);
            } else {
                let imageToProcess: File;
                let sourceImageUrl = '';
                let isBlankCanvas = false;

                if (generationMode === GenerationMode.FRAME && originalImages.length === 0) {
                    let effectiveAspectRatio = genParams.aspectRatio;
                    if (!effectiveAspectRatio || effectiveAspectRatio === 'source') {
                        effectiveAspectRatio = '16:9';
                    }
                    imageToProcess = await createBlankCanvasFile(effectiveAspectRatio);
                    isBlankCanvas = true;
                } else {
                    const sourceImageFile = originalImages[0];
                    sourceImageUrl = await fileToDataURL(sourceImageFile);
                    imageToProcess = needsPadding ? await padImageToAspectRatio(sourceImageFile, genParams.aspectRatio!) : sourceImageFile;
                }

                const styleSourceFile = (generationMode === GenerationMode.FRAME && genParams.frameMode === 'generate' && frameStyleSourceImage.length > 0)
                    ? frameStyleSourceImage[0]
                    : undefined;

                const newImageUrls = await generateImages({
                    imageFile: imageToProcess,
                    theme: genParams.theme,
                    elements: genParams.elements,
                    props: genParams.props,
                    color: colorToUse,
                    background: genParams.background,
                    negativePrompt: genParams.negativePrompt,
                    style: genParams.style,
                    count: count,
                    mode: generationMode,
                    productThemeLock: genParams.productThemeLock,
                    frameMode: genParams.frameMode,
                    frameShapeStrategy: genParams.frameShapeStrategy,
                    variationLevel: genParams.variationLevel,
                    aspectRatio: genParams.aspectRatio,
                    frameStyleSourceImageFile: styleSourceFile,
                    isBlankCanvas: isBlankCanvas,
                });
                
                const styleImageUrl = styleSourceFile ? await fileToDataURL(styleSourceFile) : undefined;

                const newImages: GeneratedImage[] = newImageUrls.map(url => ({
                    id: crypto.randomUUID(),
                    imageUrl: url,
                    params: { ...genParams },
                    mode: generationMode,
                    sourceImageUrl: sourceImageUrl,
                    frameStyleImageUrl: styleImageUrl,
                }));
                setGeneratedImages(prev => [...prev, ...newImages]);
            }

        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : '发生未知错误。');
        } finally {
            setIsLoading(false);
        }
    }, [originalImages, genParams, count, generationMode, fontSourceImage, fontStyleSourceImage, frameStyleSourceImage, buttonStyleSourceImage]);

    // --- Pet Control Callback (Refactored) ---
    const handlePetCommand = useCallback((action: PetAction) => {
        if (action.type === 'APPLY_PRESET') {
            // Apply Batch Changes from AI
            if (action.targetMode) {
                setGenerationMode(action.targetMode as GenerationMode);
            }
            if (action.params) {
                setGenParams(prev => ({ ...prev, ...action.params }));
            }
        } else if (action.type === 'TRIGGER_GENERATE') {
            handleGenerate();
        } else if (action.type === 'SET_UI_THEME' && action.themeValue) {
            setTheme(action.themeValue);
        }
    }, [handleGenerate, setTheme]);

    const handleResetContext = useCallback(() => {
        setGenParams(EMPTY_GEN_PARAMS);
    }, []);

    const handleRemoveText = useCallback(async () => {
        if (originalImages.length === 0) {
            setError('请先上传一张图片以移除文字。');
            return;
        }
        setIsRemovingText(true);
        setError(null);
        try {
            const sourceFile = originalImages[0];
            const newImageUrl = await removeTextFromImage(sourceFile);
            const newFile = await dataURLtoFile(newImageUrl, sourceFile.name);
            setOriginalImages([newFile]);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : '移除文字时发生未知错误。');
        } finally {
            setIsRemovingText(false);
        }
    }, [originalImages]);

    const handleGenerateBackground = useCallback(async () => {
        if (originalImages.length === 0) {
            setError('请先上传一张图片以生成主题。');
            return;
        }
        setIsGeneratingBackground(true);
        setError(null);
        try {
            const mainImage = originalImages[0];
            const newTheme = await generateBackgroundForProduct(mainImage);
            setGenParams(prev => ({ ...prev, theme: newTheme }));
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : '智能生成主题时发生未知错误。');
        } finally {
            setIsGeneratingBackground(false);
        }
    }, [originalImages]);

    const handleGenerateProps = useCallback(async () => {
        if (originalImages.length === 0) {
            setError('请先上传一张图片以生成道具。');
            return;
        }
        setIsGeneratingProps(true);
        setError(null);
        try {
            const mainImage = originalImages[0];
            const newProps = await generatePropsForProduct(mainImage);
            setGenParams(prev => ({ ...prev, props: newProps }));
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : '智能生成道具时发生未知错误。');
        } finally {
            setIsGeneratingProps(false);
        }
    }, [originalImages]);
    
    const handleGeneratePropsForTheme = useCallback(async () => {
        if (!genParams.theme.trim()) {
            setError('请输入一个主题以生成道具。');
            return;
        }
        setIsGeneratingThemeProps(true);
        setError(null);
        try {
            const newProps = await generatePropsForTheme(genParams.theme);
            setGenParams(prev => ({ ...prev, props: newProps }));
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'AI 智能生成道具时发生未知错误。');
        } finally {
            setIsGeneratingThemeProps(false);
        }
    }, [genParams.theme]);

    const handleGenerateElements = useCallback(async () => {
        if (!genParams.theme.trim()) {
            setError('请输入一个主题以生成装饰元素。');
            return;
        }
        setIsGeneratingElements(true);
        setError(null);
        try {
            const newElements = await generateElementsForTheme(genParams.theme);
            setGenParams(prev => ({ ...prev, elements: newElements }));
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'AI 智能生成装饰元素时发生未知错误。');
        } finally {
            setIsGeneratingElements(false);
        }
    }, [genParams.theme]);

    const handleExpandTheme = useCallback(async (themeOverride?: string) => {
        const themeToExpand = themeOverride || genParams.theme;
        if (!themeToExpand.trim()) {
            setError('请输入一个主题以进行优化。');
            return;
        }
        setIsExpandingTheme(true);
        setError(null);
        try {
            const expandedTheme = await expandThemePrompt(themeToExpand, generationMode);
            setGenParams(prev => ({ ...prev, theme: expandedTheme }));
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'AI 优化主题时发生未知错误。');
        } finally {
            setIsExpandingTheme(false);
        }
    }, [genParams.theme, generationMode]);

    const handleAddTemplate = useCallback(async () => {
        if (originalImages.length === 0) return;
        await addTemplate(originalImages[0]);
    }, [addTemplate, originalImages]);

    const handleViewImage = useCallback((image: GeneratedImage) => {
        setSelectedImage(image);
        setIsModalOpen(true);
    }, []);

    const handleEditImage = useCallback(async (image: GeneratedImage) => {
        const editableParams = { ...image.params } as any;
        if (editableParams.fontMode === 'generate' || editableParams.fontMode === 'restyle') editableParams.fontMode = 'generate-restyle';
        if (typeof editableParams.fontMode === 'undefined') editableParams.fontMode = 'generate-restyle';
        if (typeof editableParams.elementMode === 'undefined') editableParams.elementMode = 'elements';
        if (typeof editableParams.buttonMode === 'undefined') editableParams.buttonMode = 'generate';
        if (typeof editableParams.aspectRatio === 'undefined' || !editableParams.aspectRatio) editableParams.aspectRatio = (image.mode === GenerationMode.PHOTO || image.mode === GenerationMode.BACKGROUND) ? 'source' : '16:9';
        if (image.mode === GenerationMode.FONT) {
            const allowedFontRatios = ['16:9', '4:3', '1:1'];
            if (!allowedFontRatios.includes(editableParams.aspectRatio)) editableParams.aspectRatio = '16:9';
        }
        const validMaterials = Object.values(ButtonMaterialOption);
        if (!editableParams.buttonMaterial || !validMaterials.includes(editableParams.buttonMaterial)) editableParams.buttonMaterial = ButtonMaterialOption.FLAT;
        if (!editableParams.elementMaterial || !validMaterials.includes(editableParams.elementMaterial)) editableParams.elementMaterial = ButtonMaterialOption.FLAT;
        if (!editableParams.fontMaterial || !validMaterials.includes(editableParams.fontMaterial)) editableParams.fontMaterial = ButtonMaterialOption.FLAT;
        if (typeof editableParams.useFontMaterial === 'undefined') editableParams.useFontMaterial = true;
        
        editableParams.variationLevel = image.params.variationLevel ?? 25;
        editableParams.frameMode = image.params.frameMode || 'generate';
        if (editableParams.frameMode === 'outline') editableParams.frameMode = 'generate';
        if (!editableParams.frameShapeStrategy) editableParams.frameShapeStrategy = 'dynamic';

        setGenParams(editableParams as GenerationParams);
        setGenerationMode(image.mode);
        
        setFontSourceImage([]);
        setFontStyleSourceImage([]); 
        setFrameStyleSourceImage([]);
        setButtonStyleSourceImage([]);

        if (image.mode === GenerationMode.FRAME) {
            if (image.frameStyleImageUrl) {
                const styleFile = await dataURLtoFile(image.frameStyleImageUrl, 'frame-style-source.png');
                setFrameStyleSourceImage([styleFile]);
            }
            if (image.sourceImageUrl) {
                const originalFile = await dataURLtoFile(image.sourceImageUrl, 'source-image.png');
                setOriginalImages([originalFile]);
            } else {
                setOriginalImages([]); 
            }
        } else if (image.mode === GenerationMode.FONT) {
            setOriginalImages([]);
            if (image.sourceImageUrl) {
                const sourceFile = await dataURLtoFile(image.sourceImageUrl, 'font-source.png');
                setFontSourceImage([sourceFile]);
            }
            if (image.fontStyleImageUrl) {
                const styleFile = await dataURLtoFile(image.fontStyleImageUrl, 'font-style-source.png');
                setFontStyleSourceImage([styleFile]);
            }
        } else if (image.mode === GenerationMode.ELEMENT) {
            if (image.buttonStyleImageUrl) {
                const styleFile = await dataURLtoFile(image.buttonStyleImageUrl, 'button-style-source.png');
                setButtonStyleSourceImage([styleFile]);
            }
            setOriginalImages(image.sourceImageUrl ? [await dataURLtoFile(image.sourceImageUrl, 'source-image.png')] : []);
        } else { 
            const originalFile = await dataURLtoFile(image.sourceImageUrl, 'source-image.png');
            setOriginalImages([originalFile]);
        }
    }, []);

    const handleSendToFont = useCallback(async (image: GeneratedImage) => {
        setGenerationMode(GenerationMode.FONT);
        setGenParams(prev => ({...prev, fontMode: 'generate-restyle'}));
        const sourceFile = await dataURLtoFile(image.imageUrl, 'generated-image-for-font.png');
        setFontSourceImage([sourceFile]);
        setOriginalImages([]);
    }, []);
    
    const handleUseAsSource = useCallback(async (image: GeneratedImage, useAs: 'shape' | 'style') => {
        setGenerationMode(GenerationMode.FRAME);
        setGenParams(prev => ({...prev, frameMode: 'restyle'}));
        const file = await dataURLtoFile(image.imageUrl, `source-from-${image.id.substring(0,6)}.png`);
        if (useAs === 'shape') {
            setOriginalImages([file]);
        } else { 
            setFrameStyleSourceImage([file]);
        }
    }, []);

    const handleUseAsMaterial = useCallback(async (image: GeneratedImage) => {
        setGenerationMode(GenerationMode.ELEMENT);
        setGenParams(prev => ({ ...prev, elementMode: 'button', buttonMode: 'restyle', }));
        const file = await dataURLtoFile(image.imageUrl, `material-from-${image.id.substring(0,6)}.png`);
        setButtonStyleSourceImage([file]);
    }, []);

    const handleDeleteImage = useCallback((id: string) => {
        setGeneratedImages(prev => prev.filter(image => image.id !== id));
    }, []);

    const handleSelectFromLibrary = useCallback(async (imageUrl: string) => {
        const file = await dataURLtoFile(imageUrl, `template-${Date.now()}.png`);
        setOriginalImages([file]);
        setIsLibraryOpen(false);
    }, []);

    const handleOpenModifyModal = useCallback((image: GeneratedImage) => {
        setImageToModify(image);
        setIsModifyModalOpen(true);
    }, []);
    
    const handleOpenEnhanceModal = useCallback((image: GeneratedImage) => {
        setImageToEnhance(image);
        setIsEnhanceModalOpen(true);
    }, []);

    const handleApplyModification = useCallback(async (image: GeneratedImage, modificationPrompt: string): Promise<string | null> => {
        try {
            const imageFile = await dataURLtoFile(image.imageUrl, `image-to-modify.png`);
            return await modifyImage(imageFile, modificationPrompt);
        } catch (e) {
            console.error("Modification failed:", e);
            throw e;
        }
    }, []);
    
    const handleApplyEnhancement = useCallback(async (image: GeneratedImage, type: 'upscale' | 'sharpen'): Promise<string | null> => {
        try {
            const imageFile = await dataURLtoFile(image.imageUrl, `image-to-enhance.png`);
            return type === 'upscale' ? await upscaleImage(imageFile) : await sharpenImage(imageFile);
        } catch (e) {
            console.error("Enhancement failed:", e);
            throw e;
        }
    }, []);

    const handleAcceptImageUpdate = useCallback((originalImageId: string, newImageUrl: string) => {
        setGeneratedImages(prev => prev.map(img => img.id === originalImageId ? { ...img, imageUrl: newImageUrl } : img));
    }, []);

    const handleOpenCropModal = useCallback((index: number, uploader: string) => {
        const currentImages = imageFilesRef.current;
        let fileToCrop: File | null = null;
        if (uploader === 'original') fileToCrop = currentImages.originalImages[index];
        else if (uploader === 'fontSource') fileToCrop = currentImages.fontSourceImage[index];
        else if (uploader === 'frameStyleSource') fileToCrop = currentImages.frameStyleSourceImage[index];
        else if (uploader === 'buttonStyleSource') fileToCrop = currentImages.buttonStyleSourceImage[index];
        else if (uploader === 'fontStyleSource') fileToCrop = currentImages.fontStyleSourceImage[index];

        if (fileToCrop) {
            setImageToCrop({ file: fileToCrop, index, uploader });
            setIsCropModalOpen(true);
        }
    }, []);

    const handleApplyCrop = useCallback((croppedFile: File) => {
        if (imageToCrop) {
            const { index, uploader } = imageToCrop;
            const uploaderMap = {
                original: setOriginalImages,
                fontSource: setFontSourceImage,
                frameStyleSource: setFrameStyleSourceImage,
                buttonStyleSource: setButtonStyleSourceImage,
                fontStyleSource: setFontStyleSourceImage,
            };
            const setter = uploaderMap[uploader as keyof typeof uploaderMap];
            if (setter) {
                 setter(prev => {
                    const newImages = [...prev];
                    newImages[index] = croppedFile;
                    return newImages;
                });
            }
        }
        setIsCropModalOpen(false);
        setImageToCrop(null);
    }, [imageToCrop]);

    const downloadImage = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    const handleDownloadSingle = useCallback(() => {
        if (selectedImage) {
            downloadImage(selectedImage.imageUrl, `frame-${selectedImage.params.theme.replace(/\s+/g, '_')}-${selectedImage.id.substring(0,6)}.png`);
        }
    }, [selectedImage]);
    
    const handleDownloadAll = useCallback(async () => {
        if (generatedImages.length === 0 || !(window as any).JSZip) return;
        const zip = new (window as any).JSZip();
        for (const image of generatedImages) {
            const response = await fetch(image.imageUrl);
            const blob = await response.blob();
            const filename = `frame-${image.params.theme.replace(/\s+/g, '_')}-${image.id.substring(0, 6)}.png`;
            zip.file(filename, blob);
        }
        zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'ai-generated-images.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }, [generatedImages]);

    const isAnythingLoading = useMemo(() => isLoading || isImageProcessing || isGeneratingBackground || isExpandingTheme || isGeneratingProps || isGeneratingThemeProps || isGeneratingElements || isRemovingText, [isLoading, isImageProcessing, isGeneratingBackground, isExpandingTheme, isGeneratingProps, isGeneratingThemeProps, isGeneratingElements, isRemovingText]);

    const commonProps = {
        originalImages,
        setOriginalImages,
        genParams,
        setGenParams,
        count,
        setCount,
        onGenerate: handleGenerate,
        isLoading: isAnythingLoading,
        onOpenLibrary: () => setIsLibraryOpen(true),
        onAddTemplate: handleAddTemplate,
        isLibraryFull,
        onCrop: handleOpenCropModal,
        generationMode,
        setGenerationMode,
        onGenerateBackground: handleGenerateBackground,
        isGeneratingBackground,
        onGenerateProps: handleGenerateProps,
        isGeneratingProps,
        onGeneratePropsForTheme: handleGeneratePropsForTheme,
        isGeneratingThemeProps,
        onGenerateElements: handleGenerateElements,
        isGeneratingElements,
        onExpandTheme: handleExpandTheme,
        isExpandingTheme,
        onRemoveText: handleRemoveText,
        isRemovingText,
        fontSourceImage,
        setFontSourceImage,
        fontStyleSourceImage,
        setFontStyleSourceImage,
        frameStyleSourceImage,
        setFrameStyleSourceImage,
        buttonStyleSourceImage,
        setButtonStyleSourceImage,
        onResetContext: handleResetContext,
    };

    // Derived connection points
    const inputOut = { x: nodePositions.input.x + 400, y: nodePositions.input.y + 34 }; // Right side
    const settingsIn = { x: nodePositions.settings.x, y: nodePositions.settings.y + 34 }; // Left side
    const settingsOut = { x: nodePositions.settings.x + 400, y: nodePositions.settings.y + 34 }; // Right side
    const resultsIn = { x: nodePositions.results.x, y: nodePositions.results.y + 34 }; // Left side

    return (
        <div className="h-screen w-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Sidebar 
                currentMode={generationMode} 
                onModeChange={(mode) => {
                    setGenerationMode(mode);
                }}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            <div 
                ref={canvasRef}
                className={`flex-1 relative overflow-hidden ${isCanvasLocked ? 'cursor-default' : (isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab')} bg-dot-pattern`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div 
                    className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    }}
                >
                    {/* SVG Layer for Connections */}
                    <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
                        <DynamicConnectionLine start={inputOut} end={settingsIn} />
                        <DynamicConnectionLine start={settingsOut} end={resultsIn} />
                    </svg>

                    {/* Nodes */}
                    <div 
                        className="absolute" 
                        style={{ left: nodePositions.input.x, top: nodePositions.input.y, zIndex: draggingNode === 'input' ? 50 : 10 }}
                    >
                        <InputNode {...commonProps} onHeaderMouseDown={(e) => handleNodeDragStart(e, 'input')} />
                    </div>

                    <div 
                        className="absolute" 
                        style={{ left: nodePositions.settings.x, top: nodePositions.settings.y, zIndex: draggingNode === 'settings' ? 50 : 10 }}
                    >
                        <SettingsNode {...commonProps} onHeaderMouseDown={(e) => handleNodeDragStart(e, 'settings')} />
                    </div>

                    <div 
                        className="absolute" 
                        style={{ left: nodePositions.results.x, top: nodePositions.results.y, zIndex: draggingNode === 'results' ? 50 : 10 }}
                    >
                        <ResultsDisplay
                            images={generatedImages}
                            isLoading={isLoading}
                            onView={handleViewImage}
                            onEdit={handleEditImage}
                            onDelete={handleDeleteImage}
                            onModify={handleOpenModifyModal}
                            onEnhance={handleOpenEnhanceModal}
                            onDownloadAll={handleDownloadAll}
                            onSendToFont={handleSendToFont}
                            onUseAsSource={handleUseAsSource}
                            onUseAsMaterial={handleUseAsMaterial}
                            onHeaderMouseDown={(e) => handleNodeDragStart(e, 'results')}
                        />
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 flex gap-2 z-50">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2 text-xs font-mono text-slate-500 font-semibold w-16 text-center">
                        {Math.round(scale * 100)}%
                    </div>
                    <button 
                        onClick={handleFitToScreen}
                        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        title="Fit to Screen"
                    >
                       <FitToScreenIcon className="w-4 h-4"/>
                    </button>
                    <button 
                        onClick={() => setIsCanvasLocked(!isCanvasLocked)}
                        className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isCanvasLocked ? 'text-red-500' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        title={isCanvasLocked ? "解锁画布" : "锁定画布"}
                    >
                        {isCanvasLocked ? <LockIcon className="w-4 h-4"/> : <UnlockIcon className="w-4 h-4"/>}
                    </button>
                </div>
                
                {/* 3D Digital Pet Component with App Control */}
                <ThreeDPet 
                    onCommand={handlePetCommand} 
                    appState={{ uiTheme: theme, mode: generationMode, genParams: genParams }}
                />

                 {error && (
                    <div className="absolute bottom-6 right-6 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-lg z-50 flex items-start gap-4 max-w-md animate-bounce-in backdrop-blur-md">
                        <div>
                            <p className="font-bold">发生错误</p>
                            <p className="text-sm">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 flex-shrink-0">
                            <XMarkIcon className="w-5 h-5"/>
                        </button>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="图片预览">
                {selectedImage && (
                    <div className="space-y-4">
                        <img src={selectedImage.imageUrl} alt="Generated frame" className="w-full h-auto rounded-lg object-contain max-h-[70vh]" />
                        <button
                            onClick={handleDownloadSingle}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-light text-white rounded-lg hover:bg-opacity-90 transition-colors dark:bg-brand-dark dark:text-slate-900"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            下载
                        </button>
                    </div>
                )}
            </Modal>
            
            <FrameLibraryModal
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                templates={templates}
                onSelect={handleSelectFromLibrary}
                onDelete={deleteTemplate}
                onExport={exportTemplates}
                onImport={importTemplates}
            />

            <ModifyImageModal
                isOpen={isModifyModalOpen}
                onClose={() => setIsModifyModalOpen(false)}
                image={imageToModify}
                onModify={handleApplyModification}
                onAccept={handleAcceptImageUpdate}
            />
            
            <EnhanceImageModal
                isOpen={isEnhanceModalOpen}
                onClose={() => setIsEnhanceModalOpen(false)}
                image={imageToEnhance}
                onEnhance={handleApplyEnhancement}
                onAccept={handleAcceptImageUpdate}
            />

            <CropModal
                isOpen={isCropModalOpen}
                onClose={() => setIsCropModalOpen(false)}
                imageFile={imageToCrop?.file || null}
                onCropComplete={handleApplyCrop}
            />
        </div>
    );
};

export default App;