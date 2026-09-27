import { setupWorker } from 'msw/browser';

import { hackernewsHandlers } from './handlers/hackernews';

export const worker = setupWorker(...hackernewsHandlers);
