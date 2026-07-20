import { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, Image as ImageIcon, X, Check, ZoomIn, Loader2, RefreshCw, Trash2 } from 'lucide-react';

/**
 * Crops an image (data URL) down to the pixel area selected in the cropper
 * and returns it as a real File, ready to be handed to the existing
 * Cloudinary upload flow exactly like a picked file would be.
 */
async function getCroppedFile(imageSrc, cropPixels, fileName = 'photo.jpg') {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, cropPixels.width, cropPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Could not process image')); return; }
      resolve(new File([blob], fileName, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  });
}

/**
 * Drop-in avatar picker. Parent stays in full control of the actual
 * File/preview state — this component only ever hands back a finished,
 * cropped File plus an object URL, via onCapture(file, previewUrl).
 * That matches the exact shape every existing handlePhotoUpload /
 * handlePhotoSelection already expects, so wiring it in is a one-line swap.
 *
 * Props:
 *  - previewUrl:  current avatar image to display (or null)
 *  - onCapture:   (file: File, previewUrl: string) => void
 *  - onRemove:    optional () => void — shows a "Remove photo" affordance
 *  - disabled:    optional bool
 *  - size:        optional px size for the avatar circle (default 112)
 */
export default function PhotoCaptureInput({ previewUrl, onCapture, onRemove, disabled, size = 112 }) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [mode, setMode] = useState('idle'); // idle | camera | cropping
  const [facingMode, setFacingMode] = useState('user');
  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setCameraError('Image must be less than 8MB.');
      return;
    }

    setCameraError('');
    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setMode('cropping');
    };
    reader.readAsDataURL(file);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async (mode = facingMode) => {
    setCameraError('');
    setMode('camera');
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Couldn't access your camera. Check browser permissions, or upload a photo instead.");
    }
  };

  const flipCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next);
  };

  const closeAll = () => {
    stopCamera();
    setMode('idle');
    setRawImage(null);
    setCameraError('');
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      // Mirror the frame so the capture matches the selfie preview the user saw.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    setRawImage(dataUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setMode('cropping');
  };

  const confirmCrop = async () => {
    if (!croppedAreaPixels || !rawImage) return;
    setIsProcessing(true);
    try {
      const file = await getCroppedFile(rawImage, croppedAreaPixels);
      const objectUrl = URL.createObjectURL(file);
      onCapture(file, objectUrl);
      closeAll();
    } catch {
      setCameraError('Something went wrong processing that image. Please try again.');
      setMode('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden ring-1 ring-slate-100"
          style={{ width: size, height: size }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={size * 0.28} className="text-slate-300" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            type="button" disabled={disabled} onClick={openFilePicker}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <ImageIcon size={16} />
            {previewUrl ? 'Change' : 'Upload'}
          </button>
          <button
            type="button" disabled={disabled} onClick={() => startCamera()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <Camera size={16} />
            Take Photo
          </button>
          {previewUrl && onRemove && (
            <button
              type="button" disabled={disabled} onClick={onRemove}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-red-500 rounded-lg text-sm font-bold hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <Trash2 size={15} />
              Remove
            </button>
          )}
        </div>

        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
      </div>

      {/* CAMERA MODAL */}
      {mode === 'camera' && (
        <div className="fixed inset-0 z-[70] bg-slate-950/90 flex flex-col items-center justify-center p-4">
          <button onClick={closeAll} className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" aria-label="Close camera">
            <X size={22} />
          </button>

          {cameraError ? (
            <div className="text-center text-white max-w-xs">
              <p className="mb-4 text-sm text-slate-300">{cameraError}</p>
              <button onClick={closeAll} className="px-4 py-2 bg-white text-slate-900 rounded-lg font-bold text-sm">Close</button>
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />
                <div className="absolute inset-6 rounded-full border-2 border-white/40 pointer-events-none" />
              </div>

              <div className="flex items-center gap-6 mt-6">
                <button onClick={flipCamera} className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" aria-label="Flip camera">
                  <RefreshCw size={18} />
                </button>
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-white ring-4 ring-white/30 active:scale-95 transition-transform"
                  aria-label="Capture photo"
                />
                <div className="w-11" /> {/* spacer to keep capture button centered */}
              </div>
            </>
          )}
        </div>
      )}

      {/* CROP MODAL */}
      {mode === 'cropping' && rawImage && (
        <div className="fixed inset-0 z-[70] bg-slate-950/95 flex flex-col">
          <div className="flex items-center justify-between p-4 text-white flex-shrink-0">
            <button onClick={closeAll} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Cancel">
              <X size={20} />
            </button>
            <p className="font-bold text-sm">Adjust Photo</p>
            <button
              onClick={confirmCrop}
              disabled={isProcessing}
              className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
              aria-label="Confirm crop"
            >
              {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
            </button>
          </div>

          <div className="relative flex-1">
            <Cropper
              image={rawImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="p-5 flex items-center gap-3 flex-shrink-0">
            <ZoomIn size={18} className="text-white/60 flex-shrink-0" />
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-brand-blue"
            />
          </div>
        </div>
      )}
    </>
  );
}