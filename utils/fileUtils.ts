// This function is now async and can handle both data URLs and object URLs by fetching them.
export const dataURLtoFile = async (url: string, filename: string): Promise<File> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
};

export const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const padImageToAspectRatio = (file: File, aspectRatio: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const [w, h] = aspectRatio.split(':').map(Number);
        if (isNaN(w) || isNaN(h) || h === 0) {
            return reject(new Error('Invalid aspect ratio'));
        }
        const targetRatio = w / h;

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));

            let newWidth, newHeight;
            const originalRatio = img.width / img.height;

            if (targetRatio > originalRatio) {
                // Target is wider than original. New height is same as original.
                newHeight = img.height;
                newWidth = img.height * targetRatio;
            } else {
                // Target is taller than original. New width is same as original.
                newWidth = img.width;
                newHeight = img.width / targetRatio;
            }

            canvas.width = Math.round(newWidth);
            canvas.height = Math.round(newHeight);

            // Fill with white. The prompt will instruct the AI to inpaint this area.
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const x = (canvas.width - img.width) / 2;
            const y = (canvas.height - img.height) / 2;
            ctx.drawImage(img, x, y);
            
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
                resolve(new File([blob], file.name, { type: 'image/png' }));
            }, 'image/png');
        };
        
        img.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            reject(err);
        };

        img.src = objectUrl;
    });
};
