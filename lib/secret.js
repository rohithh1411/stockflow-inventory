// One place that reads JWT_SECRET. It fails loudly instead of falling back to
// a default, because a guessable secret would let anyone forge a login.
export function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is missing or too short (use at least 16 characters). Set it in your .env file.");
  }
  return new TextEncoder().encode(secret);
}
