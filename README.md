# LavenderDragonDesign Upscaler — HF Presets + Buttons UI (7.4.2)

**What you get**
- Hugging Face **model presets** prefilled (General/Anime 2×/4× + extras)
- Big **Upscale** buttons with **hover white-card** tips
- Splash screen + Lucide settings popup
- TFJS **tiling worker** (fixed-input models OK)
- Netlify + Vite ready

## Set your exact HF folders
Edit `src/lib/modelCatalog.ts` — replace the `path` values to match your Space:
```
https://huggingface.co/spaces/akessleretsy/1/resolve/main/models/<folder>/model.json
```
Examples included:
```
realesrgan/general_fast-128
realesrgan/general_plus-256
realcugan/2x-denoise2x-128
realcugan/2x-conservative-256
realcugan/2x-no-denoise-128
realcugan/3x-conservative-192
```

## Dev
npm i
npm run dev

## Build
npm run build
npm run preview

## Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- SPA via `netlify.toml`
- Optional: env `NODE_VERSION = 20`
