/** Platform boundary. Future Telegram adapter must implement this interface,
 * including lifecycle and haptics, without leaking an SDK into gameplay. */
export class PlatformAdapter {
  onSuspend(_callback) { return () => {}; }
  onFocus(_callback) { return () => {}; }
  feedback(_kind) {}
  destroy() {}
}
export class WebPlatformAdapter extends PlatformAdapter {
  constructor() { super(); this.cleanups = []; }
  onSuspend(callback) {
    const hidden = () => { if (document.hidden) callback(); };
    const blur = () => callback();
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('blur', blur);
    window.addEventListener('pagehide', blur);
    const cleanup = () => {
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('blur', blur);
      window.removeEventListener('pagehide', blur);
    };
    this.cleanups.push(cleanup); return cleanup;
  }
  onFocus(callback) {
    window.addEventListener('focus', callback);
    const cleanup = () => window.removeEventListener('focus', callback);
    this.cleanups.push(cleanup); return cleanup;
  }
  feedback(kind) {
    // Web haptics are deliberately optional (Safari does not expose vibrate).
    if (kind === 'hit' && navigator.vibrate) navigator.vibrate(70);
  }
  destroy() { this.cleanups.forEach(fn => fn()); this.cleanups = []; }
}
/** Future TelegramPlatformAdapter extends PlatformAdapter. Implement only
 * when bot integration is approved; no Telegram SDK is loaded in this build. */
export class StorageAdapter {
  load() { return { best: 0, last: null, sound: false }; }
  save(_data) { return false; }
}
export class LocalStorageAdapter extends StorageAdapter {
  constructor(storage, key = 'panda-pizza-rush:v1') { super(); this.storage = storage; this.key = key; }
  load() {
    try {
      const data = JSON.parse(this.storage?.getItem(this.key) || '{}');
      return {
        best: Number.isFinite(data?.best) ? Math.max(0, Math.floor(data.best)) : 0,
        last: data?.last && Number.isFinite(data.last.score) ? data.last : null,
        sound: data?.sound === true,
      };
    } catch { return super.load(); }
  }
  save(data) { try { this.storage?.setItem(this.key, JSON.stringify(data)); return true; } catch { return false; } }
}
