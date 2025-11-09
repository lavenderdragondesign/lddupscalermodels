# LavenderDragonDesign Upscaler — Frontend Only

**React + Vite** app. Models are hosted on **Hugging Face** and loaded at runtime via TFJS.

- Configure presets in `src/lib/modelCatalog.ts` (they point to Space CDN `model.json`)
- Netlify SPA config included via `netlify.toml`

## Dev
```
npm i
npm run dev
```

## Build
```
npm run build
```

## Deploy (Netlify from GitHub)
- Build command: `npm run build`
- Publish directory: `dist`
- Custom domain: `upscale.lddtools.lol` (CNAME → Netlify site)

## Model URL pattern (Hugging Face Space CDN)
```
https://huggingface.co/spaces/akessleretsy/1/resolve/main/models/<folder>/model.json
```
Example:
```
.../models/realesrgan/general_plus-256/model.json
.../models/realcugan/2x-denoise2x-128/model.json
```
