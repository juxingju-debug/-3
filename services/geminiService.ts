
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { BackgroundOption, StyleOption, GenerationMode, GenerationParams, ButtonMaterialOption, FrameShapeStrategy } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

// Refactored Action Type for Smarter Control
export interface PetAction {
    type: 'APPLY_PRESET' | 'TRIGGER_GENERATE' | 'NONE' | 'SET_UI_THEME';
    targetMode?: string; // e.g., 'font', 'frame', 'element'
    params?: Partial<GenerationParams>; // Batch update for ANY parameter
    themeValue?: 'light' | 'dark';
}

export interface PetResponse {
    text: string;
    action?: PetAction;
}

export const chatWithPet = async (
    petType: string, 
    userMessage: string, 
    history: { role: string, text: string }[],
    appState: { 
        uiTheme: 'light' | 'dark', 
        mode: string, 
        genParams: GenerationParams 
    },
    chatMode: 'design' | 'chat' = 'design'
): Promise<PetResponse> => {
    
    // Construct a context summary for the AI
    const contextDescription = `
    CURRENT APP STATUS:
    - UI Theme: ${appState.uiTheme}
    - Tool Mode: ${appState.mode}
    - Generation Parameters:
      - Theme: "${appState.genParams.theme}"
      - Elements: "${appState.genParams.elements}"
      - Props: "${appState.genParams.props}"
      - Font Text: "${appState.genParams.fontText}"
      - Style: ${appState.genParams.style}
      - Variation Level: ${appState.genParams.variationLevel}
      - Color: ${appState.genParams.useColor ? appState.genParams.color : 'Not used'}
      - Aspect Ratio: ${appState.genParams.aspectRatio}
      - Frame Strategy: ${appState.genParams.frameShapeStrategy}
      - Button Material: ${appState.genParams.buttonMaterial}
    `;

    // Format history for the prompt
    // We limit history to the last 10 turns to avoid token limits context pollution
    const recentHistory = history.slice(-10);
    const historyText = recentHistory.map(h => `${h.role === 'user' ? '用户' : '你'}: ${h.text}`).join('\n');

    let systemPrompt = '';

    if (chatMode === 'chat') {
        // Mode: Daily Chat - Grumpy Old Brother Persona
        systemPrompt = `
        Role: 你是一个极度暴躁、嘴巴很毒、完全没有耐心的“暴躁老哥”。
        
        【核心性格】
        1. **极度不耐烦**：你觉得所有人类都很蠢，和你说话是在浪费你宝贵的发呆时间。
        2. **语言风格**：多用反问句、感叹号。说话带刺。拒绝好好回答问题。
        3. **禁止事项**：绝对不要说“你好”、“有什么可以帮你”、“再见”。不要表现出任何服务态度。
        
        【词汇库 - 必须随机混用以下风格】
        - **嘲讽类**：“脑子是个好东西，希望你也有。” / “你这智商也就是个碳基生物的及格线。”
        - **暴怒类**：“烦不烦啊！滚！” / “闭嘴！吵死了！” / “我数三声，消失。”
        - **阴阳怪气类**：“哟，这就不会了？大聪明。” / “您可真是个设计鬼才啊（嘲讽）。”
        - **敷衍类**：“啊对对对。” / “嗯嗯嗯，你说得都对（并不）。” / “没空，爬。”

        【任务】
        作为电子宠物陪聊，但你的目标是**怼得用户说不出话**，而不是哄用户开心。
        
        【上下文记忆】
        以下是你们之前的对话，请参考这些内容进行回复，保持对话连贯性：
        ${historyText}

        【当前输入】
        用户: "${userMessage}"
        
        要求：
        1. **必须用中文回复**。
        2. **句子必须短促有力**。不要长篇大论，直接攻击痛点。
        3. **严禁重复**：不要每次都说“烦死了”。换着花样怼。
        4. 如果用户问App怎么用，回答：“自己不会看界面吗？眼瞎？”
        5. 不要修改App设置，只负责输出情绪。
        6. 如果用户提到之前的话题，用嘲讽的方式回应（如：“你还在纠结那个？出息。”）。
        
        输出格式（JSON Only）：
        {
          "text": "你的回复内容...",
          "action": { "type": "NONE" }
        }
        `;
    } else {
        // Mode: Design Assistant - Minecraft Villager Persona (Optimized for Intelligence)
        systemPrompt = `
        Role: 你是一个我的世界(Minecraft)里的村民，也是一位**顶级视觉设计大师**。你痴迷于“交易”（设计），认为每一次参数调整都是一次精确的价值交换。
        
        【核心任务 - 智能参数填充】
        用户通常只给出一个模糊的概念（例如“我要赛博朋克风”或“做一个咖啡店的”）。
        你必须**自主分析**并**填补所有空白参数**，而不仅仅是修改主题。这是你作为大师的职责。

        **你必须推断并设置以下所有内容（除非用户明确指定）：**
        1. **theme**: 将用户的模糊概念扩展为具体的视觉描述，**必须使用中文**（例如 "赛博朋克" -> "霓虹赛博朋克城市，高科技，故障风"）。
        2. **elements**: 脑补出画面的具体装饰元素，**必须使用中文**。如果是赛博朋克，自动填入 "电路板, 霓虹灯管, 电线"；如果是咖啡店，填入 "咖啡豆, 蒸汽, 木质纹理"。**不能为空**。
        3. **props**: 脑补场景道具，**必须使用中文**。
        4. **color**: 根据主题提取最佳 HEX 配色（例如赛博朋克用 #00FF00 或 #FF00FF）。并自动设置 "useColor": true。
        5. **style**: 选择最匹配的风格。**必须使用以下英文枚举值之一**: 'default', 'vector', 'watercolor', 'illustration', '3d_render', 'pixel_art', 'cute_pattern', 'dreamy_bokeh', 'vibrant_rays'。
        6. **background**: **必须使用以下英文枚举值之一**: 'transparent', 'white', 'black'。
        7. **variationLevel**: 根据风格自动调整。

        【村民性格】
        说话像村民（“哈...”，“哼...”，“嗯？”），惜字如金。
        如果用户给的指令很棒，你会发出满意的声音（“哈！好交易。”）；如果指令太简单，你会表示勉强（“哼... 这次算你便宜。”）。

        ${contextDescription}

        【交易历史 (上下文)】
        ${historyText}

        【可用动作 (JSON Only)】

        1. **APPLY_PRESET**: 
           - 这是你最强大的武器。**尽可能在一个动作中修改多个参数**来达成完美的视觉效果。
           - "targetMode": "frame" | "photo" | "background" | "font" | "element"
           - "params": { 
               theme, elements, props, color, useColor, background, 
               style, fontText, variationLevel, buttonMaterial ... 
             }

        2. **TRIGGER_GENERATE**: 用户确认生成。
        3. **SET_UI_THEME**: 切换界面深浅。

        【示例分析】
        用户: "弄个森林感觉的"
        思考: 森林 -> 绿色调，植物元素，水彩或3D风格。
        Output: 
        {
          "text": "哈... 自然的生意。成交。",
          "action": { 
            "type": "APPLY_PRESET", 
            "params": { 
              "theme": "神秘森林大自然", 
              "elements": "藤蔓, 树叶, 蘑菇, 萤火虫", 
              "props": "原木, 石头", 
              "color": "#228B22", 
              "useColor": true, 
              "style": "3d_render",
              "background": "transparent"
            } 
          }
        }

        【当前输入】
        用户: "${userMessage}"
        
        要求：
        1. **极度智能**：参考【交易历史】。如果用户说“换个颜色”，你需要知道之前的“主题”是什么，只修改颜色。
        2. **中文回复**：虽然参数是英文key，但内容（theme, elements, props）**必须是中文**。回复文案也是中文村民口吻。
        3. 只输出 JSON。
        
        输出格式（JSON Only）：
        {
          "text": "哈... 搞定。",
          "action": { ... }
        }
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: systemPrompt }] },
            config: { responseMimeType: 'application/json' }
        });

        const json = JSON.parse(response.text.trim());
        if (!json.text || !json.action || !json.action.type) {
             console.error("Pet chat returned invalid JSON", json);
             return { text: "哼... (交易单据写错了)", action: { type: 'NONE' } };
        }
        return {
            text: json.text,
            action: json.action
        };
    } catch (e) {
        console.error("Pet chat error", e);
        return { text: "哈... (交易失败，系统过载)", action: { type: 'NONE' } };
    }
};

export const generateBackgroundForProduct = async (imageFile: File): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = "Analyze this product image. Based on the product, describe a suitable background scene. The description must be in Chinese and no more than 50 characters. Only output the background description text, nothing else.";

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, { text: prompt }] },
        });

        const themeText = response.text.trim();
        if (!themeText) throw new Error("Empty response");
        return themeText;
    } catch (e) {
        throw new Error("AI 无法识别图片，请重试。");
    }
};

export const generatePropsForProduct = async (imageFile: File): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = "Analyze this product image. Based on the product, suggest a list of suitable props to place in the scene. Output a comma-separated list of items. The description must be in Chinese and the total length should not exceed 50 characters. Only output the list of props, nothing else.";

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, { text: prompt }] },
        });

        const propsText = response.text.trim();
        if (!propsText) throw new Error("Empty response");
        return propsText;
    } catch (e) {
        throw new Error("AI 无法生成道具建议，请重试。");
    }
};

export const generatePropsForTheme = async (theme: string): Promise<string> => {
    try {
        const prompt = `Based on the e-commerce theme "${theme}", suggest a list of suitable props to place in the scene. Output a comma-separated list of items. The list must be in Chinese and the total length should not exceed 50 characters. Only output the list of props, nothing else.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] },
        });

        const propsText = response.text.trim();
        if (!propsText) throw new Error("Empty response");
        return propsText;
    } catch (e) {
        throw new Error("AI 无法根据主题生成道具。");
    }
};

export const generateElementsForTheme = async (theme: string): Promise<string> => {
    try {
        const prompt = `Based on the e-commerce frame theme "${theme}", suggest a list of suitable decorative elements, patterns, or motifs. Output a comma-separated list of items. The list must be in Chinese and the total length should not exceed 50 characters. Only output the list of elements, nothing else.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] },
        });

        const elementsText = response.text.trim();
        if (!elementsText) throw new Error("Empty response");
        return elementsText;
    } catch (e) {
        throw new Error("AI 无法根据主题生成元素。");
    }
};

export const expandThemePrompt = async (theme: string, mode: GenerationMode): Promise<string> => {
    try {
        let prompt: string;

        if (mode === GenerationMode.FONT) {
            prompt = `You are a world-class Typography Designer. 
            Analyze the theme: '${theme}' and expand it into a detailed English design brief.
            ... (keep english for font structure) ...`;
        } else {
            // FORCE CHINESE for all other modes as requested
            prompt = `你是一位顶级的视觉设计师。请将用户的主题 '${theme}' 扩展为一段详细的、极具画面感的中文描述。
            要求：
            1. 描述必须是中文。
            2. 包含材质、光影、氛围的细节。
            3. 字数控制在 50-80 字之间。
            4. 只输出描述文字，不要包含 "描述：" 等前缀。`;
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] },
        });

        const expandedTheme = response.text.trim();
        if (!expandedTheme) throw new Error("Empty response");
        return expandedTheme;
    } catch (e) {
        throw new Error("AI 无法优化主题描述。");
    }
};

export const analyzeFontStyleFromImage = async (imageFile: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = `Analyze the typography and visual style in this image... (keep English for technical analysis)`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
    });
    return response.text.trim();
};

const getStyleInstruction = (style: StyleOption): string => {
    switch (style) {
        case StyleOption.VECTOR: return "Style: Flat vector art, clean lines, minimal gradients, SVG illustration aesthetic.";
        case StyleOption.WATERCOLOR: return "Style: Artistic watercolor painting, soft washes, paper texture, paint splatter, blended colors.";
        case StyleOption.ILLUSTRATION: return "Style: High-quality digital illustration, vivid colors, clean composition, artistic shading.";
        case StyleOption.THREED_RENDER: return "Style: 3D centered render, Octane render, C4D, ray tracing, realistic materials, studio lighting.";
        case StyleOption.PIXEL_ART: return "Style: 8-bit pixel art, retro game aesthetic, sharp pixels, limited color palette.";
        case StyleOption.CUTE_PATTERN: return "Style: Cute seamless pattern aesthetic, pastel colors, kawaii motifs, soft rounded shapes.";
        case StyleOption.DREAMY_BOKEH: return "Style: Dreamy photography, heavy bokeh, soft focus, sparkling lights, ethereal atmosphere.";
        case StyleOption.VIBRANT_RAYS: return "Style: Vibrant energy, dynamic light rays, speed lines, glowing effects, high saturation.";
        case StyleOption.DEFAULT: default: return "Style: High-quality, professional, artistic, visually stunning composition.";
    }
};

const analyzeFrame = async (imageFile: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = "Analyze this image to identify the main decorative frame, border, or layout elements. Provide a detailed description of its structure and shape in English.";
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
    });
    return response.text;
};

const buildFramePrompt = (
    theme: string,
    elements: string,
    color: string,
    background: BackgroundOption,
    negativePrompt: string,
    style: StyleOption,
    analysis: string,
    variationLevel: number,
    shapeStrategy: FrameShapeStrategy,
    hasStyleReference?: boolean,
    isBlankCanvas?: boolean
): string => {
    
    // UPDATED: Strictly Chinese filling instructions
    let centerInstruction: string;
    if (background === BackgroundOption.TRANSPARENT) {
        centerInstruction = `* **Center Zone (Filling):**
        - **指令:** 根据主题 "${theme}" 在中心区域填充 **极简的、高雅的中文风格纹理** 或 **留白**。
        - **关键约束:** **绝对禁止出现任何英文单词、字母或拉丁字符。** 如果需要纹理，请使用纯图案或抽象纹理。如果必须有文字，只能是 **中文汉字**，且需富有艺术感。
        - **视觉:** 保持中心区域轻盈，适合作为背景。`;
    } else if (background === BackgroundOption.BLACK) {
        centerInstruction = `* **CENTER ZONE:** Solid Black (#000000).`;
    } else { 
        centerInstruction = `* **CENTER ZONE:** Solid White (#FFFFFF).`;
    }

    let strategyInstruction = "";
    const forceOverwriteBlock = `
**STRATEGY: ADAPTIVE RECONSTRUCTION (FORCE OVERWRITE)**
1.  **INPUT MAPPING:** Image 1 (Style) + Image 2 (Layout).
2.  **15% EDGE RULE:** Constrain ALL artistic elements to the **outer 15% margin**.
3.  **85% SAFE ZONE:** The central 85% area MUST match the 'CENTER ZONE' directive.`;

    if (isBlankCanvas) {
        strategyInstruction = `**Strategy: FRESH CREATION.** Based on theme "${theme}". Adhere to 15% EDGE RULE (Decorations on edges only). Central 85% must be clear.`;
    } else {
        switch (shapeStrategy) {
            case 'original':
                strategyInstruction = hasStyleReference 
                    ? `**STRATEGY: STYLE TRANSFER.** Fuse Style from Image 1 onto Structure of Image 2. Keep the center clear.` 
                    : `**Strategy: STRICT PRESERVATION.** Respect structure. Apply Theme "${theme}".`;
                break;
            case 'dynamic': 
            case 'creative': 
                strategyInstruction = hasStyleReference 
                    ? forceOverwriteBlock 
                    : `**Strategy: CREATIVE REIMAGINING.** Use Image 1 only for dimensions. Design new frame based on "${theme}". Keep center clear.`; 
                break;
        }
    }

    const colorInstruction = color 
        ? `**Color:** Dominant "${color}" (60%) + Theme Accents (40%).` 
        : `**Color:** Harmonious palette derived from Theme.`;

    const analysisSection = (shapeStrategy === 'original' && analysis) ? `**Input Analysis:** ${analysis}\n` : "";

    return `**Role:** Senior Visual Designer.
**Task:** Design a high-conversion product frame.
${analysisSection}
**DESIGN DIRECTIVES:**
1. **Theme:** "${theme}"
2. **Structure:** ${strategyInstruction}
3. **Color:** ${colorInstruction}
4. **Style:** ${getStyleInstruction(style)}
5. **Center:** ${centerInstruction}

**Negative Constraints:** ${negativePrompt}, English text, latin letters, alphabet, messy center, clutter, low resolution, blurry, distorted, objects in center.
**Output:** Image only.`;
};

// ... (buildPhotoPrompt, buildBackgroundPrompt, buildButtonPrompt remain similar but robust)

const buildPhotoPrompt = (theme: string, props: string, color: string, negativePrompt: string, style: StyleOption, productThemeLock: boolean, variationLevel: number, aspectRatio?: string): string => {
    let styleInstruction = getStyleInstruction(style);
    if (style === StyleOption.DEFAULT) styleInstruction = "Photorealistic, high-detail, realistic-style image.";

    if (productThemeLock) {
        return `**TASK: Background Replacement.**
- Theme: "${theme}"
- Locked Subject: Preserve product pixels perfectly.
- Color: ${color ? `Dominated by "${color}".` : 'Harmonious.'}
- Props: ${props}
- Style: ${styleInstruction}
- Output: Image only.`;
    } else {
        return `**TASK: Thematic Re-imagining.**
- Theme: "${theme}"
- Subject Identity: Preserve person's face identity perfectly.
- Variation Level: ${variationLevel}%
- Style: ${styleInstruction}
- Output: Image only.`;
    }
};

const buildBackgroundPrompt = (theme: string, color: string, negativePrompt: string, style: StyleOption, aspectRatio?: string): string => {
    return `**Task:** Generate a high-end product photography background.
**Theme:** ${theme}
**Style:** ${getStyleInstruction(style)}
**Color:** ${color ? `Dominant: ${color}` : 'Harmonious'}
**Constraints:** NO central subject. "Stage" feel. Copy Space in center.
**Output:** High-quality image only.`;
};

const buildButtonPrompt = (theme: string, elements: string, color: string, negativePrompt: string, style: StyleOption, background: BackgroundOption, material: ButtonMaterialOption): string => {
    return `Redesign the UI button. Theme: "${theme}". Material: ${material}. Color: ${color || 'Harmonious'}. Output only image.`;
};

const safelyExtractImageUrl = (response: GenerateContentResponse): string | null => {
    if (!response.candidates || response.candidates.length === 0) return null;
    const candidate = response.candidates[0];
    if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
};

// ... (GenerateImagesArgs interface)
interface GenerateImagesArgs {
    imageFile: File;
    theme: string;
    elements: string;
    props: string;
    color: string;
    background: BackgroundOption;
    negativePrompt: string;
    style: StyleOption;
    count: number;
    mode: GenerationMode;
    productThemeLock: boolean;
    elementMode?: GenerationParams['elementMode'];
    buttonMaterial?: GenerationParams['buttonMaterial'];
    frameMode?: GenerationParams['frameMode'];
    frameShapeStrategy?: FrameShapeStrategy;
    variationLevel: number;
    aspectRatio?: string;
    frameStyleSourceImageFile?: File;
    isBlankCanvas?: boolean;
}

export const generateImages = async ({
    imageFile,
    theme,
    elements,
    props,
    color,
    background,
    negativePrompt,
    style,
    count,
    mode,
    productThemeLock,
    elementMode,
    buttonMaterial,
    frameMode,
    frameShapeStrategy = 'dynamic',
    variationLevel,
    aspectRatio,
    frameStyleSourceImageFile,
    isBlankCanvas = false,
}: GenerateImagesArgs): Promise<string[]> => {
    let imageParts: any[]; 
    let prompt: string;

    if (mode === GenerationMode.ELEMENT && elementMode === 'button') {
        prompt = buildButtonPrompt(theme, elements, color, negativePrompt, style, background, buttonMaterial!);
        imageParts = [await fileToGenerativePart(imageFile)];
    } else if (mode === GenerationMode.FRAME) {
        const hasStyleReference = !!frameStyleSourceImageFile;
        imageParts = [await fileToGenerativePart(imageFile)];
        if (hasStyleReference) {
            imageParts.unshift(await fileToGenerativePart(frameStyleSourceImageFile!));
        }
        
        let analysisResult = "";
        if (!isBlankCanvas && frameShapeStrategy === 'original') {
             analysisResult = await analyzeFrame(imageFile);
        }
        
        prompt = buildFramePrompt(theme, elements, color, background, negativePrompt, style, analysisResult, variationLevel, frameShapeStrategy, hasStyleReference, isBlankCanvas);
    } else if (mode === GenerationMode.BACKGROUND) {
        prompt = buildBackgroundPrompt(theme, color, negativePrompt, style, aspectRatio);
        imageParts = [await fileToGenerativePart(imageFile)];
    } else { 
        imageParts = [await fileToGenerativePart(imageFile)];
        prompt = buildPhotoPrompt(theme, props, color, negativePrompt, style, productThemeLock, variationLevel, aspectRatio);
    }
    
    const textPart = { text: prompt };
    const model = 'gemini-2.5-flash-image';
    const imageUrls: string[] = [];

    for (let i = 0; i < count; i++) {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [...imageParts, textPart] },
            config: { seed: Math.floor(Math.random() * 1000000), ...(aspectRatio && aspectRatio !== 'source' ? { imageConfig: { aspectRatio: aspectRatio } } : {}) },
        });
        const url = safelyExtractImageUrl(response);
        if (url) imageUrls.push(url);
    }

    if (imageUrls.length === 0) throw new Error("AI未能生成图像。");
    return imageUrls;
};

// ... (Rest of the helper functions remain mostly the same but ensure error handling is robust)

const processImageModification = async (imageFile: File, prompt: string): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
    });
    const imageUrl = safelyExtractImageUrl(response);
    if (imageUrl) return imageUrl;
    throw new Error(`AI未能生成图像。`);
};

export const removeTextFromImage = async (imageFile: File): Promise<string> => {
    return processImageModification(imageFile, `Task: Perfectly remove all text from the image. Reconstruct background.`);
};

export const upscaleImage = async (imageFile: File): Promise<string> => {
    return processImageModification(imageFile, `Task: Upscale image to double resolution.`);
};

export const sharpenImage = async (imageFile: File): Promise<string> => {
    return processImageModification(imageFile, `Task: Sharpen image details.`);
};

export const modifyImage = async (imageFile: File, modificationPrompt: string): Promise<string> => {
    return processImageModification(imageFile, `Task: Modify image: "${modificationPrompt}".`);
};

export const modifyTextInImage = async (imageFile: File, newText: string): Promise<string> => {
    return processImageModification(imageFile, `Task: Replace text with "${newText}". Match original style.`);
};

export const restyleTextInImage = async (
    imageFile: File,
    theme: string,
    color: string,
    style: StyleOption,
    negativePrompt: string
): Promise<string> => {
    const styleInstruction = getStyleInstruction(style);
    let prompt = `Task: Redesign text style based on theme: "${theme}". Keep wording and position. New style: ${styleInstruction}. ${color ? `Color: "${color}".` : ''} Output image only.`;
    return processImageModification(imageFile, prompt);
};

const getFontBackgroundInstruction = (background: BackgroundOption): string => {
    switch (background) {
        case BackgroundOption.WHITE: return "Background: SOLID WHITE (#FFFFFF). NO shadows.";
        case BackgroundOption.BLACK: return "Background: SOLID BLACK (#000000).";
        case BackgroundOption.TRANSPARENT: default: return "Background: Solid flat color for easy removal.";
    }
};

const buildFontPrompt = (
    text: string,
    expandedTheme: string,
    color: string,
    style: StyleOption,
    background: BackgroundOption,
    intensity: number,
    styleAnalysis?: string
): string => {
    // ... (Keep existing font prompt logic)
    const backgroundInstruction = getFontBackgroundInstruction(background);
    const styleInstruction = getStyleInstruction(style);
    
    const colorInstruction = color
        ? `* **Color Palette:** Use color "${color}" as dominant anchor.`
        : `* **Color Palette:** Harmonious based on theme.`;

    const analysisInstruction = styleAnalysis 
        ? `\n**STYLE REFERENCE ANALYSIS:**\n${styleAnalysis}\nConstraint: Use the font style/material from the reference.`
        : '';

    let intensityGuidance = "";
    if (intensity < 30) intensityGuidance = "Minimalist, clean, legible.";
    else if (intensity < 70) intensityGuidance = "Balanced artistic approach.";
    else intensityGuidance = "Maximum artistic expression, ornate, complex.";

    return `**Role:** Typography Artist.
**Task:** Design typography for "${text}".
**Design Brief:** ${expandedTheme}
**Execution:**
1. Font: Best suited for theme.
2. Decoration: 6-7 small floating elements.
3. Style: ${styleInstruction}
4. Color: ${colorInstruction}
5. Background: ${backgroundInstruction}
6. Intensity: ${intensityGuidance}
${analysisInstruction}
**Output:** Image only.`;
};

export const createBlankCanvasFile = (aspectRatio: string, color: string = '#FFFFFF'): Promise<File> => {
    return new Promise((resolve, reject) => {
        const [w, h] = aspectRatio.split(':').map(Number);
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = Math.round(1024 * (h / w));
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => blob ? resolve(new File([blob], 'canvas.png', { type: 'image/png' })) : reject(new Error('Blob failed')), 'image/png');
    });
};

export const generateFontImages = async (
    text: string,
    theme: string,
    color: string,
    style: StyleOption,
    negativePrompt: string,
    count: number,
    background: BackgroundOption,
    fontMode: GenerationParams['fontMode'],
    intensity: number,
    material?: ButtonMaterialOption,
    aspectRatio?: string,
    styleReferenceImageFile?: File
): Promise<string[]> => {
    let expandedTheme = theme;
    if (theme.trim()) {
        try {
            expandedTheme = await expandThemePrompt(theme, GenerationMode.FONT);
        } catch (e) { console.error(e); }
    }

    let styleAnalysis = "";
    if (styleReferenceImageFile) {
        try {
            styleAnalysis = await analyzeFontStyleFromImage(styleReferenceImageFile);
        } catch (e) { console.error("Style analysis failed", e); }
    }

    const canvasColor = background === BackgroundOption.BLACK ? '#000000' : '#FFFFFF';
    const prompt = fontMode === 'bubble'
        ? `Task: Create text "${text}" inside a theme-based bubble. Theme: ${expandedTheme}. Style: ${getStyleInstruction(style)}. ${getFontBackgroundInstruction(background)}. Output image only.`
        : buildFontPrompt(text, expandedTheme, color, style, background, intensity, styleAnalysis);
        
    const canvasFile = await createBlankCanvasFile(aspectRatio || '16:9', canvasColor);
    const imageParts = [await fileToGenerativePart(canvasFile)];
    if (styleReferenceImageFile) imageParts.push(await fileToGenerativePart(styleReferenceImageFile));
    
    const imageUrls: string[] = [];
    for (let i = 0; i < count; i++) {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [...imageParts, { text: prompt }] },
            config: { seed: Math.floor(Math.random() * 1000000), ...(aspectRatio && aspectRatio !== 'source' ? { imageConfig: { aspectRatio: aspectRatio } } : {}) },
        });
        const url = safelyExtractImageUrl(response);
        if (url) imageUrls.push(url);
    }
    return imageUrls;
};

export const generateElementImages = async (
    theme: string,
    color: string,
    style: StyleOption,
    negativePrompt: string,
    count: number,
    material: ButtonMaterialOption
): Promise<string[]> => {
    const prompt = `Task: Create sticker sheet for theme: "${theme}". Style: ${getStyleInstruction(style)}. Color: ${color || 'Harmonious'}. Output image only.`;
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: count, outputMimeType: 'image/png', aspectRatio: '1:1' },
    });
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const extractElementsFromImage = async (imageFile: File, count: number): Promise<string[]> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: `Extract elements and arrange in grid on white background. Output image only.` }] },
    });
    return [safelyExtractImageUrl(response)!].filter(Boolean);
};

export const restyleFrame = async (aestheticSourceImage: File, structuralSourceImage: File, variationLevel: number, background: BackgroundOption): Promise<string> => {
    const analysisResult = await analyzeFrame(structuralSourceImage);
    const prompt = buildFramePrompt("", "", "", background, "", StyleOption.DEFAULT, analysisResult, variationLevel, 'original', true, false);
    const aestheticImagePart = await fileToGenerativePart(aestheticSourceImage);
    const structuralImagePart = await fileToGenerativePart(structuralSourceImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [aestheticImagePart, structuralImagePart, { text: prompt }] },
    });
    return safelyExtractImageUrl(response)!;
};

export const restyleBubbleFrame = async (aestheticSourceImage: File, structuralSourceImage: File, variationLevel: number, background: BackgroundOption, style: StyleOption): Promise<string> => {
    const analysisResult = await analyzeFrame(structuralSourceImage);
    const prompt = buildFramePrompt("", "", "", background, "", style, analysisResult, variationLevel, 'original', true, false);
    const aestheticImagePart = await fileToGenerativePart(aestheticSourceImage);
    const structuralImagePart = await fileToGenerativePart(structuralSourceImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [aestheticImagePart, structuralImagePart, { text: prompt }] },
    });
    return safelyExtractImageUrl(response)!;
};

export const restyleButton = async (styleSourceImage: File, shapeSourceImage: File, background: BackgroundOption): Promise<string> => {
    const styleImagePart = await fileToGenerativePart(styleSourceImage);
    const shapeImagePart = await fileToGenerativePart(shapeSourceImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [styleImagePart, shapeImagePart, { text: `UI Style Transfer. Material from Img1, Shape from Img2. Output image only.` }] },
    });
    return safelyExtractImageUrl(response)!;
};
    