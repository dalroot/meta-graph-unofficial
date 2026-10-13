export function humanJitter(minSec = 1.0, maxSec = 2.5) {
  const ms = (Math.random() * (maxSec - minSec) + minSec) * 1000;
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseCookies(cookieString) {
  const result = {};
  if (!cookieString) return result;
  const parts = cookieString.split(';');
  for (const part of parts) {
    const [key, ...vals] = part.trim().split('=');
    if (key) {
      result[key.trim()] = vals.join('=').trim();
    }
  }
  return result;
}
