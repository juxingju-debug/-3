
import { BackgroundOption, StyleOption, ButtonMaterialOption, FrameShapeStrategy } from '../types';

export const translateBackgroundOption = (option: BackgroundOption) => {
    switch (option) {
        case BackgroundOption.TRANSPARENT: return '透明';
        case BackgroundOption.WHITE: return '白色';
        case BackgroundOption.BLACK: return '黑色';
        default: return option;
    }
};

export const translateStyleOption = (option: StyleOption) => {
    switch (option) {
        case StyleOption.DEFAULT: return '默认风格';
        case StyleOption.VECTOR: return '矢量';
        case StyleOption.WATERCOLOR: return '水彩';
        case StyleOption.ILLUSTRATION: return '插画';
        case StyleOption.THREED_RENDER: return '3D';
        case StyleOption.PIXEL_ART: return '像素';
        default: return option;
    }
};

export const translateButtonMaterialOption = (option: ButtonMaterialOption) => {
    switch (option) {
        case ButtonMaterialOption.FLAT: return '扁平';
        case ButtonMaterialOption.CLAY: return '3D';
        case ButtonMaterialOption.C4D: return 'C4D材质';
        default: return option;
    }
};

export const translateFrameShapeStrategy = (option: FrameShapeStrategy) => {
    switch (option) {
        case 'original': return '保持原形';
        case 'dynamic': return '智能适配';
        case 'creative': return '自由重构';
        default: return option;
    }
};
