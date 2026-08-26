export function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const item of header.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) {
      try { return decodeURIComponent(parts.join("=")); } catch { return undefined; }
    }
  }
  return undefined;
}

export const authCookieOptions = (isProduction) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
});
