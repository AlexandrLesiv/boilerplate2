import { setupWorker } from 'msw/browser';

import { configHandlers } from './handlers/config';
import { hackernewsHandlers } from './handlers/hackernews';

export const worker = setupWorker(...configHandlers, ...hackernewsHandlers);
