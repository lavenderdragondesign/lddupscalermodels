// TFJS Web Worker: loads model.json from HF and returns a PNG Blob URL
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'

type Job = { id: string; file: File; modelUrl: string }
type Msg =
  | { id: string; type: 'progress'; value: number }
  | { id: string; type: 'done'; blobUrl: string }
  | { id: string; type: 'error'; error: string }

async function toBitmap(file: File) {
  const buf = await file.arrayBuffer()
  return await createImageBitmap(new Blob([buf], { type: file.type }))
}

function bitmapToNHWC(bmp: ImageBitmap): tf.Tensor4D {
  const w = bmp.width, h = bmp.height
  const c = new OffscreenCanvas(w, h)
  const ctx = c.getContext('2d')!
  ctx.drawImage(bmp, 0, 0)
  const data = ctx.getImageData(0, 0, w, h).data

  const arr = new Float32Array(h * w * 3)
  let ai = 0
  for (let i = 0; i < data.length; i += 4) {
    arr[ai++] = data[i] / 255
    arr[ai++] = data[i + 1] / 255
    arr[ai++] = data[i + 2] / 255
  }
  const t3 = tf.tensor3d(arr, [h, w, 3], 'float32')
  return t3.expandDims(0) // [1,H,W,3]
}

async function tensorToBlob(t: tf.Tensor, mime = 'image/png'): Promise<Blob> {
  const [h, w, c] = (t.shape as number[]).slice(-3)
  const cpu = (await t.data()) as Float32Array
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(w, h)
  let di = 0
  for (let i = 0; i < h * w; i++) {
    img.data[di++] = Math.max(0, Math.min(255, Math.round(cpu[i * c + 0] * 255)))
    img.data[di++] = Math.max(0, Math.min(255, Math.round(cpu[i * c + 1] * 255)))
    img.data[di++] = Math.max(0, Math.min(255, Math.round(cpu[i * c + 2] * 255)))
    img.data[di++] = 255
  }
  ctx.putImageData(img, 0, 0)
  return await new Promise(res => canvas.toBlob(b => res(b!), mime))
}

self.onmessage = (async (e: MessageEvent<Job>) => {
  const { id, file, modelUrl } = e.data
  try {
    ;(self as any).postMessage({ id, type: 'progress', value: 5 } as Msg)
    await tf.setBackend('webgl'); await tf.ready()
    const model = await tf.loadGraphModel(modelUrl)
    ;(self as any).postMessage({ id, type: 'progress', value: 20 } as Msg)

    const bmp = await toBitmap(file)
    const input = bitmapToNHWC(bmp)               // [1,H,W,3]
    const feeds: Record<string, tf.Tensor> = { [model.inputs[0].name]: input }
    const outAny = await model.executeAsync(feeds)
    const out = Array.isArray(outAny) ? outAny[0] : outAny as tf.Tensor // [1,H,W,3]

    ;(self as any).postMessage({ id, type: 'progress', value: 90 } as Msg)

    const out3 = (out as any).squeeze() // [H,W,3]
    const blob = await tensorToBlob(out3)
    out3.dispose(); (input as any).dispose()

    const url = URL.createObjectURL(blob)
    ;(self as any).postMessage({ id, type: 'done', blobUrl: url } as Msg)
  } catch (err: any) {
    ;(self as any).postMessage({ id, type: 'error', error: String(err?.message || err) } as Msg)
  }
})
