// Copyright © 2026 Christopher Snow.
export const WARP_SIZE = 32;
export const WORD_BYTES = 4;
export const SECTOR_BYTES = 32;

/** Address-set model of one FP32 load instruction issued by a warp.
 * Counts distinct aligned 32-byte sectors, not DRAM reads or elapsed cycles.
 */
export function simulateLoad({ stride = 1, offset = 0, activeLanes = 32 } = {}) {
  for (const [name, value, min, max] of [
    ['stride', stride, 1, 32], ['offset', offset, 0, 31],
    ['activeLanes', activeLanes, 1, WARP_SIZE],
  ]) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${name} must be an integer from ${min} to ${max}.`);
    }
  }
  const lanes = Array.from({ length: WARP_SIZE }, (_, id) => {
    const element = offset + id * stride;
    const address = element * WORD_BYTES;
    return { id, active: id < activeLanes, element, address,
      sector: Math.floor(address / SECTOR_BYTES) };
  });
  const groups = new Map();
  for (const lane of lanes.filter(lane => lane.active)) {
    if (!groups.has(lane.sector)) groups.set(lane.sector, []);
    groups.get(lane.sector).push(lane.id);
  }
  const sectors = [...groups].map(([id, laneIds]) => ({
    id, startAddress: id * SECTOR_BYTES, laneIds,
    words: Array.from({ length: SECTOR_BYTES / WORD_BYTES }, (_, word) => {
      const address = id * SECTOR_BYTES + word * WORD_BYTES;
      return { address, laneIds: laneIds.filter(laneId => lanes[laneId].address === address) };
    }),
  }));
  const usefulBytes = activeLanes * WORD_BYTES;
  const coveredBytes = sectors.length * SECTOR_BYTES;
  return { lanes, sectors, usefulBytes, coveredBytes,
    utilisation: usefulBytes / coveredBytes,
    minimumSectors: Math.ceil(usefulBytes / SECTOR_BYTES) };
}

export function kernelSource({ stride, offset }) {
  // Configuration is validated by the same model as the figure.
  simulateLoad({ stride, offset });
  return `__global__ void gather(const float* x, float* y, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        y[i] = x[${offset} + i * ${stride}];
    }
}`;
}
