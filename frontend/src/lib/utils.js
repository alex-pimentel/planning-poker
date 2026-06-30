/**
 * Generate a random alphanumeric room code.
 */
export function generateRoomCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Map a card value to a numeric score for averaging.
 */
export function cardValueToNumber(value) {
  if (value === "?") return null;
  if (value === "XS") return 1;
  if (value === "S") return 2;
  if (value === "M") return 3;
  if (value === "L") return 5;
  if (value === "XL") return 8;
  if (value === "XXL") return 13;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}
