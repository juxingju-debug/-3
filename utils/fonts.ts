export interface Font {
    name: string;
    description: string; // A description for the AI prompt
}

export interface FontCategory {
    name: string;
    fonts: Font[];
}

export const fontLibrary: FontCategory[] = [
    {
        name: '节日庆典',
        fonts: [
            { name: '圣诞欢乐', description: 'a cheerful, festive font with snowflakes or holly accents, suitable for Christmas' },
            { name: '万圣惊魂', description: 'a spooky, dripping, or jagged font, perfect for Halloween' },
            { name: '新年快乐', description: 'an elegant, celebratory font with firework or confetti elements, for New Year' },
            { name: '生日派对', description: 'a fun, bouncy, and colorful font, like it is made of balloons or confetti' },
            { name: '情人节浪漫', description: 'a romantic, flowing script or cursive font with hearts' },
        ]
    },
    {
        name: '现代简约',
        fonts: [
            { name: '未来科技', description: 'a clean, geometric, sans-serif font with a futuristic or sci-fi feel' },
            { name: '都市霓虹', description: 'a bright, glowing neon sign font' },
            { name: '极简无衬线', description: 'a minimal, thin, and clean sans-serif font' },
            { name: '粗体海报', description: 'a bold, impactful, heavy sans-serif font suitable for headlines' },
            { name: '数字像素', description: 'a retro, pixelated font reminiscent of old video games' },
        ]
    },
    {
        name: '优雅古典',
        fonts: [
            { name: '复古手写', description: 'an elegant, classic, looping cursive script font' },
            { name: '哥特中世纪', description: 'an ornate, traditional blackletter or Gothic font' },
            { name: '装饰艺术', description: 'an Art Deco style font with geometric shapes and a vintage feel' },
            { name: '典雅衬线', description: 'a classic, high-contrast serif font like Didot or Bodoni' },
            { name: '铜板印刷', description: 'a formal, engraved script font, like Copperplate' },
        ]
    },
    {
        name: '趣味手绘',
        fonts: [
            { name: '卡通漫画', description: 'a playful, comic book style font' },
            { name: '儿童涂鸦', description: 'a cute, handwritten font that looks like a child\'s crayon drawing' },
            { name: '粉笔板书', description: 'a chalk-style font that looks like it was written on a blackboard' },
            { name: '画笔笔触', description: 'a font that looks like it was painted with a brush, with visible strokes' },
            { name: '随性马克笔', description: 'a casual, handwritten marker pen font' },
        ]
    },
    {
        name: '自然主题',
        fonts: [
            { name: '木质纹理', description: 'a font that appears to be carved from wood or has a wood grain texture' },
            { name: '藤蔓缠绕', description: 'a font made of intertwined vines and leaves' },
            { name: '水波荡漾', description: 'a font that looks like it is made of liquid or has ripples' },
            { name: '岩石雕刻', description: 'a font that looks chiseled from stone or rock' },
            { name: '云朵字体', description: 'a soft, fluffy font that looks like clouds' },
        ]
    },
    {
        name: '材质特效',
        fonts: [
            { name: '流光金属', description: 'a font with a polished, reflective metallic texture, like chrome or gold' },
            { name: '破碎玻璃', description: 'a font that appears to be made of shattered or cracked glass' },
            { name: '毛绒质感', description: 'a soft, fluffy font with a plush or fur texture' },
            { name: '钻石水晶', description: 'a font that looks like it is carved from clear, sparkling crystal or diamond' },
            { name: '液体黄金', description: 'a font made of dripping, molten liquid gold' },
        ]
    },
    {
        name: '游戏科幻',
        fonts: [
            { name: '赛博朋克', description: 'a futuristic, high-tech font with glitch effects and neon highlights' },
            { name: '蒸汽朋克', description: 'a font with gears, pipes, and other victorian industrial elements' },
            { name: '魔法符文', description: 'a font that looks like ancient, glowing magical runes' },
            { name: '星际舰队', description: 'a font with a bold, angular style, like lettering on a starship hull' },
            { name: '8-Bit 游戏', description: 'a classic 8-bit pixel art font from retro video games' },
        ]
    },
    {
        name: '美食饮品',
        fonts: [
            { name: '巧克力融化', description: 'a font that looks like it is made of rich, melting chocolate' },
            { name: '奶油裱花', description: 'a sweet, decorative font that looks like piped frosting or whipped cream' },
            { name: '饼干烘焙', description: 'a font that looks like it is made from baked cookie dough' },
            { name: '清爽果汁', description: 'a juicy, refreshing font that looks like it is made from fruit or liquid' },
            { name: '咖啡拉花', description: 'an elegant font with swirls and patterns like latte art' },
        ]
    },
    {
        name: '其他风格',
        fonts: [
            { name: '涂鸦喷漆', description: 'a graffiti-style font, as if spray-painted on a wall' },
            { name: '恐怖电影', description: 'a horror movie title font, often with a distressed or bloody texture' },
            { name: '剪纸艺术', description: 'a font that looks like it was cut from paper' },
            { name: '缝线针织', description: 'a font that appears to be stitched or embroidered' },
            { name: '火焰燃烧', description: 'a font that is on fire, with flames licking the letters' },
            { name: '冰雪奇缘', description: 'a font made of ice, with icicles and frost details' },
            { name: '星空璀璨', description: 'a font filled with a starry night sky or galaxy texture' },
        ]
    }
];