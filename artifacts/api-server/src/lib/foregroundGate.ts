let foregroundCount = 0;
let lastForegroundAt = 0;

export function beginForeground(): () => void {
  foregroundCount += 1;
  lastForegroundAt = Date.now();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    foregroundCount = Math.max(0, foregroundCount - 1);
    lastForegroundAt = Date.now();
  };
}

export async function waitForIdleForeground(quietMs = 4000): Promise<void> {
  while (foregroundCount > 0 || Date.now() - lastForegroundAt < quietMs) {
    await new Promise((r) => setTimeout(r, 500));
  }
}
