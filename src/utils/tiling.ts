export interface TileJob {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export function makeTiles(
  width: number,
  height: number,
  tileSize: number,
  overlap: number
): TileJob[] {
  const jobs: TileJob[] = [];

  for (let y = 0; y < height; y += tileSize - overlap) {
    for (let x = 0; x < width; x += tileSize - overlap) {
      const sw = Math.min(tileSize, width - x);
      const sh = Math.min(tileSize, height - y);
      jobs.push({ sx: x, sy: y, sw, sh });
    }
  }

  return jobs;
}
