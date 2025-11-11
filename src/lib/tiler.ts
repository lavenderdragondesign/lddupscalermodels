
import * as ort from 'onnxruntime-web'
import { imageDataToNHWC, NHWCtoNCHW, tensorToImageData } from './onnx'

export async function runTiled(
  session: ort.InferenceSession,
  source: HTMLCanvasElement,
  opts: { tileSize: number; overlap: number; expects?: 'NHWC'|'NCHW'; scale: number }
): Promise<HTMLCanvasElement> {
  const { tileSize, overlap, expects='NHWC', scale } = opts
  const srcCtx = source.getContext('2d')!
  const { width, height } = source

  const outCanvas = document.createElement('canvas')
  outCanvas.width = Math.floor(width * scale)
  outCanvas.height = Math.floor(height * scale)
  const outCtx = outCanvas.getContext('2d')!

  for (let y=0; y<height; y += tileSize - overlap) {
    for (let x=0; x<width; x += tileSize - overlap) {
      const sw = Math.min(tileSize, width - x)
      const sh = Math.min(tileSize, height - y)
      const img = srcCtx.getImageData(x, y, sw, sh)

      let input = imageDataToNHWC(img)
      if (expects === 'NCHW') input = NHWCtoNCHW(input)

      const feeds: Record<string, ort.Tensor> = {}
      feeds[session.inputNames[0]] = input

      const results = await session.run(feeds)
      const outT = results[session.outputNames[0]] as ort.Tensor
      const outImg = tensorToImageData(outT)

      outCtx.putImageData(outImg, Math.floor(x * scale), Math.floor(y * scale))
    }
  }
  return outCanvas
}
