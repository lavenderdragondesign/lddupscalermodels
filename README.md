# LavenderDragonDesign Upscaler — Netlify Deploy (Frontend Only)

React + Vite + TypeScript app. Models are hosted on **Hugging Face** and loaded at runtime via **TFJS**.

## Configure presets
Edit `src/lib/modelCatalog.ts` and set the right-hand paths to your folders on Hugging Face.
They resolve to:
```
https://huggingface.co/spaces/akessleretsy/1/resolve/main/models/<folder>/model.json
```

## Dev
```
npm i
npm run dev
```

## Build
```
npm run build
npm run preview
```

## Deploy to Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- `netlify.toml` already includes SPA redirect.
- Optional: set Environment variable `NODE_VERSION = 20`.

## Custom domain (recommended)
Point `upscale.lddtools.lol` (CNAME) to your Netlify site.
