import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import Modal from './Modal';

interface CropModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageFile: File | null;
    onCropComplete: (croppedFile: File) => void;
    aspectRatio?: number; // e.g., 16 / 9, 1 for square
}

// Function to get the cropped image as a File object
async function getCroppedImg(
    image: HTMLImageElement,
    crop: Crop,
    fileName: string,
): Promise<File | null> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height,
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                resolve(null);
                return;
            }
            const croppedFile = new File([blob], fileName, { type: blob.type });
            resolve(croppedFile);
        }, 'image/png');
    });
}

const CropModal: React.FC<CropModalProps> = ({
    isOpen,
    onClose,
    imageFile,
    onCropComplete,
    aspectRatio,
}) => {
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (imageFile) {
            const objectUrl = URL.createObjectURL(imageFile);
            setImgSrc(objectUrl);
            // Reset crop state when new image is loaded
            setCrop(undefined);
            setCompletedCrop(undefined);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [imageFile]);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const newCrop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                aspectRatio || width / height,
                width,
                height,
            ),
            width,
            height,
        );
        setCrop(newCrop);
        setCompletedCrop(newCrop);
    }

    const handleApplyCrop = async () => {
        if (completedCrop && imgRef.current && imageFile) {
            const croppedFile = await getCroppedImg(imgRef.current, completedCrop, imageFile.name);
            if (croppedFile) {
                onCropComplete(croppedFile);
                onClose();
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="裁剪图片">
            <div className="space-y-4">
                {imgSrc && (
                    <div className="flex justify-center bg-slate-200 dark:bg-slate-900 rounded-lg p-4">
                         <ReactCrop
                            crop={crop}
                            onChange={c => setCrop(c)}
                            onComplete={c => setCompletedCrop(c)}
                            aspect={aspectRatio}
                            className="max-h-[60vh]"
                        >
                            <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imgSrc}
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    </div>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleApplyCrop}
                        disabled={!completedCrop}
                        className="px-4 py-2 bg-brand-light text-white rounded-lg hover:bg-opacity-90 dark:bg-brand-dark dark:text-slate-900 transition-colors disabled:opacity-50"
                    >
                        应用裁剪
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default React.memo(CropModal);
