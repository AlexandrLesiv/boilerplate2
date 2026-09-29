import { mount, StartClient } from '@solidjs/start/client';

mount(() => <StartClient />, document);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js', { type: 'module' });
}
