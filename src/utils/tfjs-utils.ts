
import * as tf from "@tensorflow/tfjs";

/**
 * Basic constant/zero padding (replacement for pad.onnx).
 * Assumes NHWC [1, H, W, C].
 */
export function pad(
  input: tf.Tensor4D,
  top: number,
  bottom: number,
  left: number,
  right: number,
  constantValue = 0
): tf.Tensor4D {
  return tf.pad(
    input,
    [
      [0, 0],
      [top, bottom],
      [left, right],
      [0, 0],
    ],
    constantValue
  ) as tf.Tensor4D;
}

/**
 * Reflection padding (replacement for reflection_pad.onnx).
 */
export function reflectionPad(
  input: tf.Tensor4D,
  top: number,
  bottom: number,
  left: number,
  right: number
): tf.Tensor4D {
  const padTop = top;
  const padBottom = bottom;
  const padLeft = left;
  const padRight = right;

  const maxTopBottom = Math.max(padTop, padBottom);
  const maxLeftRight = Math.max(padLeft, padRight);

  const padded = tf.mirrorPad(
    input,
    [
      [0, 0],
      [maxTopBottom, maxTopBottom],
      [maxLeftRight, maxLeftRight],
      [0, 0],
    ],
    "reflect"
  ) as tf.Tensor4D;

  const [, h, w] = padded.shape.slice(0, 3);
  const startY = maxTopBottom - padTop;
  const startX = maxLeftRight - padLeft;
  const endY = h - (maxTopBottom - padBottom);
  const endX = w - (maxLeftRight - padRight);

  return padded.slice(
    [0, startY, startX, 0],
    [1, endY - startY, endX - startX, input.shape[3]]
  ) as tf.Tensor4D;
}

/**
 * Replication padding / edge repeat (replacement for replication_pad.onnx).
 */
export function replicationPad(
  input: tf.Tensor4D,
  top: number,
  bottom: number,
  left: number,
  right: number
): tf.Tensor4D {
  const [b, h, w, c] = input.shape;

  let out = input;

  // Top / bottom rows
  if (top > 0) {
    const topRow = input.slice([0, 0, 0, 0], [b, 1, w, c]).tile([1, top, 1, 1]);
    out = tf.concat([topRow, out], 1) as tf.Tensor4D;
  }
  if (bottom > 0) {
    const bottomRow = input
      .slice([0, h - 1, 0, 0], [b, 1, w, c])
      .tile([1, bottom, 1, 1]);
    out = tf.concat([out, bottomRow], 1) as tf.Tensor4D;
  }

  const [, h2, w2] = out.shape;
  if (left > 0) {
    const leftCol = out.slice([0, 0, 0, 0], [b, h2, 1, c]).tile([1, 1, left, 1]);
    out = tf.concat([leftCol, out], 2) as tf.Tensor4D;
  }
  if (right > 0) {
    const rightCol = out
      .slice([0, 0, w2 - 1, 0], [b, h2, 1, c])
      .tile([1, 1, right, 1]);
    out = tf.concat([out, rightCol], 2) as tf.Tensor4D;
  }

  return out;
}

/**
 * Simple anti-alias / low-pass filter (replacement for antialias.onnx).
 * Applies a 3x3 Gaussian blur style kernel to each channel.
 */
export function antialias(input: tf.Tensor4D): tf.Tensor4D {
  const kernel = tf.tensor4d(
    [
      [
        [
          [1 / 16],
          [2 / 16],
          [1 / 16],
        ],
        [
          [2 / 16],
          [4 / 16],
          [2 / 16],
        ],
        [
          [1 / 16],
          [2 / 16],
          [1 / 16],
        ],
      ],
    ],
    [3, 3, 1, 1]
  );

  const [b, h, w, c] = input.shape;
  const channels = tf.split(input, c, 3);
  const filteredChannels = channels.map((ch) =>
    tf.conv2d(ch as tf.Tensor4D, kernel, 1, "same")
  );
  return tf.concat(filteredChannels, 3) as tf.Tensor4D;
}

/**
 * Alpha border padding (replacement for alpha_border_padding.onnx).
 * Operates on ImageData so it can be used before converting to tensors.
 */
export function alphaBorderPadding(img: ImageData, padding: number): ImageData {
  const newW = img.width + padding * 2;
  const newH = img.height + padding * 2;
  const out = new ImageData(newW, newH);
  const src = img.data;
  const dst = out.data;

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const srcIdx = (y * img.width + x) * 4;
      const dstIdx = ((y + padding) * newW + (x + padding)) * 4;
      dst[dstIdx] = src[srcIdx];
      dst[dstIdx + 1] = src[srcIdx + 1];
      dst[dstIdx + 2] = src[srcIdx + 2];
      dst[dstIdx + 3] = src[srcIdx + 3];
    }
  }
  // borders are left transparent
  return out;
}

/**
 * Create a seam-blending mask for tile overlaps (replacement for create_seam_blending_filter.onnx).
 * Returns [1, H, W, 1] with values 0..1 (0 near edges, 1 in interior).
 */
export function createSeamBlendMask(
  height: number,
  width: number,
  overlap: number
): tf.Tensor4D {
  const ys = tf.linspace(0, height - 1, height);
  const xs = tf.linspace(0, width - 1, width);

  const yGrid = tf.tile(ys.reshape([height, 1]), [1, width]);
  const xGrid = tf.tile(xs.reshape([1, width]), [height, 1]);

  const distTop = yGrid;
  const distBottom = tf.sub(height - 1, yGrid);
  const distLeft = xGrid;
  const distRight = tf.sub(width - 1, xGrid);

  const distEdge = tf.minimum(
    tf.minimum(distTop, distBottom),
    tf.minimum(distLeft, distRight)
  );

  const mask = tf.clipByValue(tf.div(distEdge, overlap), 0, 1);
  return mask.reshape([1, height, width, 1]) as tf.Tensor4D;
}

/**
 * Blend a source patch into a destination accumulator using a seam mask.
 * dst = dst * (1 - mask) + src * mask
 */
export function blendPatchWithMask(
  dst: tf.Tensor4D,
  src: tf.Tensor4D,
  mask: tf.Tensor4D
): tf.Tensor4D {
  return tf.add(
    tf.mul(dst, tf.sub(1, mask)),
    tf.mul(src, mask)
  ) as tf.Tensor4D;
}

/**
 * TTA split approximation (replacement for tta_split.onnx).
 * Returns 8 augmentations: identity, flips, and transposed variants.
 */
export function ttaSplit(input: tf.Tensor4D): tf.Tensor4D[] {
  const imgs: tf.Tensor4D[] = [];

  imgs.push(input); // identity
  imgs.push(tf.image.flipLeftRight(input));
  imgs.push(tf.image.flipUpDown(input));
  imgs.push(tf.image.flipUpDown(tf.image.flipLeftRight(input)));

  const t = tf.transpose(input, [0, 2, 1, 3]) as tf.Tensor4D;
  imgs.push(t);
  imgs.push(tf.image.flipLeftRight(t));
  imgs.push(tf.image.flipUpDown(t));
  imgs.push(tf.image.flipUpDown(tf.image.flipLeftRight(t)));

  return imgs;
}

/**
 * TTA merge approximation (replacement for tta_merge.onnx).
 * Expects 8 tensors as returned by ttaSplit, averages them back.
 */
export function ttaMerge(preds: tf.Tensor4D[]): tf.Tensor4D {
  if (preds.length !== 8) {
    throw new Error(`ttaMerge expects 8 tensors, got ${preds.length}`);
  }

  const [p0, p1, p2, p3, p4, p5, p6, p7] = preds;

  const r0 = p0;
  const r1 = tf.image.flipLeftRight(p1);
  const r2 = tf.image.flipUpDown(p2);
  const r3 = tf.image.flipUpDown(tf.image.flipLeftRight(p3));

  const t0 = p4;
  const t1 = tf.image.flipLeftRight(p5);
  const t2 = tf.image.flipUpDown(p6);
  const t3 = tf.image.flipUpDown(tf.image.flipLeftRight(p7));

  const rt0 = tf.transpose(t0, [0, 2, 1, 3]) as tf.Tensor4D;
  const rt1 = tf.transpose(t1, [0, 2, 1, 3]) as tf.Tensor4D;
  const rt2 = tf.transpose(t2, [0, 2, 1, 3]) as tf.Tensor4D;
  const rt3 = tf.transpose(t3, [0, 2, 1, 3]) as tf.Tensor4D;

  const all = [r0, r1, r2, r3, rt0, rt1, rt2, rt3];
  const sum = tf.addN(all) as tf.Tensor4D;
  return tf.div(sum, all.length) as tf.Tensor4D;
}
