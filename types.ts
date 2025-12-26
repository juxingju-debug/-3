
export enum BackgroundOption {
    TRANSPARENT = 'transparent',
    WHITE = 'white',
    BLACK = 'black',
}

export enum StyleOption {
    DEFAULT = 'default',
    VECTOR = 'vector',
    WATERCOLOR = 'watercolor',
    ILLUSTRATION = 'illustration',
    THREED_RENDER = '3d_render',
    PIXEL_ART = 'pixel_art',
    CUTE_PATTERN = 'cute_pattern',
    DREAMY_BOKEH = 'dreamy_bokeh',
    VIBRANT_RAYS = 'vibrant_rays',
}

export enum GenerationMode {
    FRAME = 'frame',
    PHOTO = 'photo',
    BACKGROUND = 'background',
    FONT = 'font',
    ELEMENT = 'element',
}

export enum ButtonMaterialOption {
    FLAT = 'flat', // 扁平
    CLAY = 'clay', // 3D
    C4D = 'c4d', // C4D
}

export type FrameShapeStrategy = 'original' | 'dynamic' | 'creative';

export interface GenerationParams {
    theme: string;
    elements: string;
    props: string;
    color: string;
    useColor: boolean;
    background: BackgroundOption;
    negativePrompt: string;
    style: StyleOption;
    productThemeLock: boolean;
    fontText: string;
    fontMode: 'generate-restyle' | 'modify' | 'bubble';
    elementMode: 'elements' | 'background' | 'button';
    buttonMode: 'generate' | 'restyle';
    buttonMaterial: ButtonMaterialOption;
    elementMaterial: ButtonMaterialOption;
    fontMaterial: ButtonMaterialOption;
    useFontMaterial: boolean;
    variationLevel: number;
    aspectRatio?: string;
    frameMode: 'generate' | 'restyle' | 'outline' | 'bubble';
    frameShapeStrategy: FrameShapeStrategy;
}

export interface GeneratedImage {
    id: string;
    imageUrl: string; // data URL
    params: GenerationParams;
    mode: GenerationMode;
    sourceImageUrl: string;
    batchSourceImageUrls?: string[];
    frameStyleImageUrl?: string;
    buttonStyleImageUrl?: string;
    fontStyleImageUrl?: string;
}

export type Theme = 'light' | 'dark';

export interface FrameTemplate {
  id: string;
  imageUrl: string; // data URL
}
