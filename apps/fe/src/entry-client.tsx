import { mount, StartClient } from '@solidjs/start/client';
import { initLogger } from './common/libs/logger';

initLogger();

mount(() => <StartClient />, document);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { type: 'module' });
}
