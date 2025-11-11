import React, { useCallback, useMemo, useRef, useState } from 'react';
import { runImageModelFromUrl } from '@/lib/ortRunner';

type Category = 'art' | 'art_scan' | 'photo' | 'photo_scan' | 'art_hd' | 'photo_hd';
type Noise = 0 | 1 | 2 | 3;

type Props = {
  modelBase?: string;
  padMultiple?: number;
  bgr?: boolean;
  className?: string;
};

const CATEGORIES: Category[] = ['art','art_scan','photo','photo_scan','art_hd','photo_hd'];
const NOISES: Noise[] = [0,1,2,3];

export default function UpscalerUI({
  modelBase = '/onnx_models',
  padMultiple = 8,
  bgr = false,
  className = '',
}: Props) {
  const [category, setCategory] = useState<Category>('art_scan');
  const [noise, setNoise] = useState<Noise>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inputURL, setInputURL] = useState<string | null>(null);
  const [outURL, setOutURL] = useState<string | null>(null);

  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modelURL = useMemo(() => {
    return `${modelBase}/swin_unet/${category}/noise${noise}_scale2x.onnx`;
  }, [modelBase, category, noise]);

  const onPickFile = useCallback(() => fileInputRef.current?.click(), []);

  const drawImageToCanvas = useCallback(async (file: File) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    setInputURL(img.src);
    setOutURL(null);
    const c = inputCanvasRef.current!;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    const maxPreview = 640;
    const scale = Math.min(1, maxPreview / Math.max(img.width, img.height));
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
  }, []);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    try { await drawImageToCanvas(f); }
    catch (err: any) { setError(err?.message || String(err)); }
  }, [drawImageToCanvas]);

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError(null);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    try { await drawImageToCanvas(f); }
    catch (err: any) { setError(err?.message || String(err)); }
  }, [drawImageToCanvas]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => e.preventDefault(), []);

  const doUpscale = useCallback(async () => {
    setBusy(true); setError(null);
    try {
      const inputCanvas = inputCanvasRef.current!;
      if (!inputCanvas?.width || !inputCanvas?.height) throw new Error('Please load an image first.');
      const inCtx = inputCanvas.getContext('2d', { willReadFrequently: true })!;
      const imgData = inCtx.getImageData(0, 0, inputCanvas.width, inputCanvas.height);

      const { image } = await runImageModelFromUrl(modelURL, imgData, {
        padMultiple, normalize: true, bgr
      });

      const outCanvas = outputCanvasRef.current!;
      outCanvas.width = image.width;
      outCanvas.height = image.height;
      const outCtx = outCanvas.getContext('2d')!;
      outCtx.putImageData(image, 0, 0);
      const url = outCanvas.toDataURL('image/png');
      setOutURL(url);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setBusy(false);
    }
  }, [modelURL, padMultiple, bgr]);

  return (
    <div className={`w-full max-w-6xl mx-auto ${className}`}>
      <div className="flex flex-col gap-3 p-4 rounded-2xl border shadow-sm bg-white">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold mr-2">Category:</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-full border text-sm ${c === category ? 'bg-black text-white' : 'bg-gray-50 hover:bg-gray-100'}`}>
                {labelize(c)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-semibold">Noise:</span>
          <div className="flex gap-2">
            {NOISES.map((n) => (
              <button key={n} onClick={() => setNoise(n)}
                className={`px-3 py-1 rounded-full border text-sm ${n === noise ? 'bg-black text-white' : 'bg-gray-50 hover:bg-gray-100'}`}>
                {n}
              </button>
            ))}
          </div>
          <div className="ml-auto text-xs text-gray-500">
            <code className="bg-gray-100 px-1 py-0.5 rounded">swin_unet/{category}/noise{noise}_scale2x.onnx</code>
          </div>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="mt-1 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer hover:bg-gray-50"
          onClick={onPickFile}
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="font-medium">Drop an image here or click to choose</div>
          <div className="text-xs text-gray-500 mt-1">PNG/JPG/WebP</div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={doUpscale} disabled={busy}
            className={`px-4 py-2 rounded-xl text-white ${busy ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'}`}>
            {busy ? 'Upscaling…' : 'Upscale (2×)'}
          </button>
          {outURL && (
            <a href={outURL} download="upscaled.png" className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
              Download PNG
            </a>
          )}
          {error && <div className="text-red-600 text-sm ml-auto">{error}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="p-3 rounded-2xl border bg-white">
          <div className="text-sm font-semibold mb-2">Input</div>
          <div className="w-full overflow-auto">
            <canvas ref={inputCanvasRef} className="rounded-lg border max-w-full" />
          </div>
          {inputURL && <div className="mt-2 text-xs text-gray-500 break-all">{inputURL}</div>}
        </div>
        <div className="p-3 rounded-2xl border bg-white">
          <div className="text-sm font-semibold mb-2">Upscaled</div>
          <div className="w-full overflow-auto">
            <canvas ref={outputCanvasRef} className="rounded-lg border max-w-full" />
          </div>
          {outURL && <div className="mt-2 text-xs text-gray-500 break-all">{outURL.slice(0,96)}…</div>}
        </div>
      </div>
    </div>
  );
}

function labelize(key: string) {
  return key.split('_').map((s) => s[0].toUpperCase() + s.slice(1)).join(' ');
}
