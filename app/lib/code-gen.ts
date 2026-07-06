const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluidos I, 1, 0, O para evitar confusión visual

export function generatePartyCode(length: number = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return result;
}

/**
 * Human-writable DM recovery code, e.g. "ABCD-EFGH-JKLM-NPQR".
 * 16 chars over a 32-symbol alphabet ≈ 80 bits of entropy.
 */
export function generateRecoveryCode(): string {
  const groups = 4;
  const groupLength = 4;
  return Array.from({ length: groups }, () =>
    Array.from({ length: groupLength }, () =>
      CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length)),
    ).join(""),
  ).join("-");
}
