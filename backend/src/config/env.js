export function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set. Add it to your environment variables.");
  }

  return jwtSecret;
}
