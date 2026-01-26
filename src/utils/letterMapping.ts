/**
 * Maps character slot positions to alphabetical letters for visual distinction.
 *
 * Slot positions are 1-based (first character = position 1).
 * Letters follow A-Z, then AA, AB, AC... for positions beyond 26.
 */

/**
 * Convert a slot position (1-based) to an alphabetical letter sequence.
 *
 * @param slotPosition - The 1-based position of the character in creation order
 * @returns Alphabetical letter(s) representing the position (A, B, C, ..., Z, AA, AB, ...)
 */
export function slotPositionToLetter(slotPosition: number): string {
  if (slotPosition <= 0) {
    throw new Error(`slotPosition must be positive, got ${slotPosition}`);
  }

  let n = slotPosition;
  let result = "";

  while (n > 0) {
    n--; // Convert to 0-indexed
    const remainder = n % 26;
    const char = String.fromCharCode(65 + remainder); // 65 = 'A'
    result = char + result;
    n = Math.floor(n / 26);
  }

  return result;
}
