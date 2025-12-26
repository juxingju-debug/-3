import { useState, useEffect, useCallback } from 'react';
import { FrameTemplate } from '../types';
import { 
    initDB, 
    addTemplateToDB, 
    getAllTemplatesFromDB, 
    deleteTemplateFromDB,
    getTemplateCountFromDB 
} from '../utils/db';
import { dataURLtoFile, fileToDataURL } from '../utils/fileUtils';

const MAX_TEMPLATES = 50;

// Helper function to create object URLs from stored templates
const createObjectUrlsForTemplates = (storedTemplates: { id: string; file: File }[]): FrameTemplate[] => {
    return storedTemplates.map(({ id, file }) => ({
        id,
        imageUrl: URL.createObjectURL(file),
    }));
};

export const useFrameLibrary = () => {
    const [templates, setTemplates] = useState<FrameTemplate[]>([]);
    const [count, setCount] = useState(0);
    const [isDbInitialized, setIsDbInitialized] = useState(false);

    // Initialize DB on mount
    useEffect(() => {
        initDB().then(() => {
            setIsDbInitialized(true);
        }).catch(error => {
            console.error("Failed to initialize DB", error);
        });
    }, []);

    // Load templates once DB is initialized and manage object URL lifecycle
    useEffect(() => {
        if (!isDbInitialized) return;

        let isMounted = true;

        const loadTemplates = async () => {
            try {
                const storedTemplates = await getAllTemplatesFromDB();
                if (isMounted) {
                    const displayTemplates = createObjectUrlsForTemplates(storedTemplates);
                    setTemplates(displayTemplates);
                    setCount(storedTemplates.length);
                }
            } catch (error) {
                console.error("Failed to load templates from DB", error);
            }
        };

        loadTemplates();

        return () => {
            isMounted = false;
        };
    }, [isDbInitialized]);
    
    // Effect for cleaning up object URLs when the component unmounts or templates change
    useEffect(() => {
        const urls = templates.map(t => t.imageUrl);
        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [templates]);

    const addTemplate = useCallback(async (file: File) => {
        if (!isDbInitialized) return;

        const currentCount = await getTemplateCountFromDB();
        if (currentCount >= MAX_TEMPLATES) {
            console.warn("Frame library is full.");
            alert("素材库已满 (50/50)。请删除一些模板以添加新的模板。");
            return;
        }

        try {
            const newId = await addTemplateToDB(file);
            const newTemplateForDisplay: FrameTemplate = {
                id: newId,
                imageUrl: URL.createObjectURL(file),
            };
            
            setTemplates(prev => [...prev, newTemplateForDisplay]);
            setCount(prev => prev + 1);
        } catch (error) {
            console.error("Failed to add template", error);
        }
    }, [isDbInitialized]);

    const deleteTemplate = useCallback(async (id: string) => {
        if (!isDbInitialized) return;
        
        try {
            await deleteTemplateFromDB(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
            setCount(prev => prev - 1);
        } catch (error) {
            console.error("Failed to delete template", error);
        }
    }, [isDbInitialized]);

    const exportTemplates = useCallback(async () => {
        if (!isDbInitialized) return;
        try {
            const storedTemplates = await getAllTemplatesFromDB();
            if (storedTemplates.length === 0) {
                alert("素材库是空的，无需导出。");
                return;
            }
    
            const exportData = await Promise.all(storedTemplates.map(async (template) => ({
                id: template.id,
                name: template.file.name,
                type: template.file.type,
                data: await fileToDataURL(template.file)
            })));
            
            const jsonString = JSON.stringify({ version: 1, templates: exportData }, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
    
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-frame-library-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
    
        } catch (error) {
            console.error("Failed to export templates", error);
            alert("导出失败，请查看控制台获取更多信息。");
        }
    }, [isDbInitialized]);

    const importTemplates = useCallback(async (file: File) => {
        if (!isDbInitialized) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result as string);
                if (json.version !== 1 || !Array.isArray(json.templates)) {
                    throw new Error("无效的备份文件格式。");
                }
    
                const currentCount = await getTemplateCountFromDB();
                if (currentCount + json.templates.length > MAX_TEMPLATES) {
                    alert(`导入将超出素材库容量限制 (${MAX_TEMPLATES})。\n\n当前: ${currentCount}\n导入: ${json.templates.length}\n总计: ${currentCount + json.templates.length}`);
                    return;
                }
    
                const newDisplayTemplates: FrameTemplate[] = [];
    
                for (const item of json.templates) {
                    const newFile = await dataURLtoFile(item.data, item.name);
                    const newId = await addTemplateToDB(newFile);
                    const newTemplateForDisplay: FrameTemplate = {
                        id: newId,
                        imageUrl: URL.createObjectURL(newFile),
                    };
                    newDisplayTemplates.push(newTemplateForDisplay);
                }
    
                setTemplates(prev => [...prev, ...newDisplayTemplates]);
                setCount(prev => prev + newDisplayTemplates.length);
                
                alert(`成功导入 ${newDisplayTemplates.length} 个素材！`);
    
            } catch (error) {
                console.error("Failed to import templates", error);
                alert(`导入失败：${error instanceof Error ? error.message : String(error)}`);
            }
        };
        reader.readAsText(file);
    }, [isDbInitialized]);

    return {
        templates,
        addTemplate,
        deleteTemplate,
        isFull: count >= MAX_TEMPLATES,
        count,
        exportTemplates,
        importTemplates,
    };
};
