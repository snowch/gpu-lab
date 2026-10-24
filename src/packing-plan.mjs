// Copyright © 2026 Christopher Snow.
import { simulateLoad } from './model.mjs';

const ROWS = 32;
const FEATURES = 8;

/**
 * Compare two ways to read the same first column from a contiguous (32, 8)
 * FP32 tensor. Counts aligned 32-byte sector touches per model operation,
 * NOT elapsed time, cache misses, DRAM transactions or PyTorch copy internals.
 */
export function compareColumnPlans(reads) {
  if (!Number.isInteger(reads) || reads < 1 || reads > 64) {
    throw new RangeError('reads must be an integer between 1 and 64');
  }
  const strided = simulateLoad({ stride: FEATURES, offset: 0, activeLanes: ROWS });
  const consecutive = simulateLoad({ stride: 1, offset: 0, activeLanes: ROWS });
  const tensor = Array.from({ length: ROWS * FEATURES }, (_, i) => i);
  const originalValues = Array.from({ length: ROWS }, (_, row) => tensor[row * FEATURES]);
  // A packed column has the same logical values in separate, consecutive storage.
  const packedValues = originalValues.slice();
  const directPerRead = strided.sectors.length;
  const packedPerRead = consecutive.sectors.length;
  const packRead = strided.sectors.length;
  const packWrite = consecutive.sectors.length;
  const directTotal = reads * directPerRead;
  const packedTotal = packRead + packWrite + reads * packedPerRead;
  const best = directTotal < packedTotal ? 'direct'
    : packedTotal < directTotal ? 'packed' : 'tie';
  return {
    reads, originalValues, packedValues, directPerRead, packedPerRead,
    packRead, packWrite, directTotal, packedTotal, best,
  };
}
