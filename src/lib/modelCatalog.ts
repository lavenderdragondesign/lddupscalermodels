export const HF_BASE =
  'https://huggingface.co/spaces/akessleretsy/1/resolve/main/models' as const;

// Build a TFJS model.json URL from a folder under /models
export const tfjsUrl = (folder: string) => `${HF_BASE}/${folder}/model.json`;

// Friendly presets (edit the right-hand side to your actual folders)
export const PRESETS = {
  auto: { label: 'Best Auto',   hint: 'Chooses for you based on image size/type.', path: 'realesrgan/general_plus-128' },
  g2x:  { label: 'General 2×',  hint: 'Photos/logos. Fast & clean.',               path: 'realesrgan/general_fast-128' },
  g4x:  { label: 'General 4×',  hint: 'Bigger export, more detail.',               path: 'realesrgan/general_plus-256' },
  a2x:  { label: 'Anime 2×',    hint: 'Line-art & flat colors.',                   path: 'realcugan/2x-denoise2x-128' },
  a4x:  { label: 'Anime 4×',    hint: 'Crisp large anime output.',                 path: 'realcugan/2x-conservative-256' }
} as const

export type PresetKey = keyof typeof PRESETS
