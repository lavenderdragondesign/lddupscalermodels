export const HF_BASE =
  'https://huggingface.co/spaces/akessleretsy/1/resolve/main/models' as const;

// Build a TFJS model.json URL from a folder under /models
export const tfjsUrl = (folder: string) => `${HF_BASE}/${folder}/model.json`;

/**
 * Presets — friendly names mapped to HF folders.
 * Replace the right-hand 'path' with your *exact* folder names on the Space.
 * These are examples based on your earlier structure.
 */
export const PRESETS = {
  auto: { label: 'Best Auto',   hint: 'Picks a good default for mixed images.', path: 'realesrgan/general_plus-128' },

  g2x:  { label: 'General 2×',  hint: 'Photos/logos. Fast & clean.',            path: 'realesrgan/general_fast-128' },
  g4x:  { label: 'General 4×',  hint: 'Larger export with more detail.',        path: 'realesrgan/general_plus-256' },

  a2x:  { label: 'Anime 2×',    hint: 'Line-art & flat colors (denoise 2).',    path: 'realcugan/2x-denoise2x-128' },
  a4x:  { label: 'Anime 4×',    hint: 'Crisper big anime output.',              path: 'realcugan/2x-conservative-256' },

  a2x_clean: { label: 'Anime 2× Clean', hint: 'No-denoise for already clean art.', path: 'realcugan/2x-no-denoise-128' },
  a3x_cons:  { label: 'Anime 3×',       hint: '3× upscale conservative.',          path: 'realcugan/3x-conservative-192' }
} as const

export type PresetKey = keyof typeof PRESETS
