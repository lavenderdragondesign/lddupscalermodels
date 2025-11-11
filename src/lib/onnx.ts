
import * as ort from 'onnxruntime-web'

export type ModelEntry = {
  id: string
  label: string
  path: string
  scale: number
  expects?: 'NHWC'|'NCHW'
}
export type Manifest = {
  version: string
  base: string
  models: ModelEntry[]
}

export async function fetchManifest(url: string): Promise<Manifest> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`)
  return res.json()
}

export async function createSession(url: string) {
  try {
    return await ort.InferenceSession.create(url, { executionProviders: ['webgpu'] as any })
  } catch {
    return await ort.InferenceSession.create(url, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' })
  }
}

export function imageDataToNHWC(img: ImageData): ort.Tensor {
  const { data, width, height } = img
  const out = new Float32Array(width * height * 3)
  let j = 0
  for (let i = 0; i < data.length; i += 4) {
    out[j++] = data[i] / 255
    out[j++] = data[i+1] / 255
    out[j++] = data[i+2] / 255
  }
  return new ort.Tensor('float32', out, [1, height, width, 3])
}

export function NHWCtoNCHW(t: ort.Tensor): ort.Tensor {
  const [n,h,w,c] = t.dims
  const src = t.data as Float32Array
  const out = new Float32Array(n*c*h*w)
  for (let i=0;i<h;i++){
    for (let j=0;j<w;j++){
      for (let k=0;k<c;k++){
        out[k*h*w + i*w + j] = src[(i*w + j)*c + k]
      }
    }
  }
  return new ort.Tensor('float32', out, [n,c,h,w])
}

export function tensorToImageData(t: ort.Tensor): ImageData {
  const dims = t.dims
  const isNHWC = dims.length === 4 && dims[3] === 3
  const isNCHW = dims.length === 4 && dims[1] === 3
  let w,h; let data: Float32Array
  if (isNHWC) {
    ;[, h, w] = dims
    data = t.data as Float32Array
    const out = new Uint8ClampedArray(w*h*4)
    let j = 0
    for (let i=0;i<data.length;i+=3){
      out[j++] = Math.max(0, Math.min(255, Math.round(data[i]*255)))
      out[j++] = Math.max(0, Math.min(255, Math.round(data[i+1]*255)))
      out[j++] = Math.max(0, Math.min(255, Math.round(data[i+2]*255)))
      out[j++] = 255
    }
    return new ImageData(out, w, h)
  } else if (isNCHW) {
    ;[, , h, w] = dims
    data = t.data as Float32Array
    const out = new Uint8ClampedArray(w*h*4)
    let idx = 0
    const planeSize = w*h
    for (let i=0;i<planeSize;i++){
      const r = data[i] * 255
      const g = data[planeSize + i] * 255
      const b = data[2*planeSize + i] * 255
      out[idx++] = Math.max(0, Math.min(255, Math.round(r)))
      out[idx++] = Math.max(0, Math.min(255, Math.round(g)))
      out[idx++] = Math.max(0, Math.min(255, Math.round(b)))
      out[idx++] = 255
    }
    return new ImageData(out, w, h)
  }
  throw new Error('Unsupported tensor shape: ' + JSON.stringify(dims))
}
