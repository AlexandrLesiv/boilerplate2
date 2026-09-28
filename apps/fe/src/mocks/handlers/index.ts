import { authHandlers } from './auth';
import { configHandlers } from './config';
import { hackernewsHandlers } from './hackernews';

/** Every endpoint the app calls, on its happy path — enough to run the whole thing on mocks. */
export const allHandlers = [...configHandlers, ...authHandlers, ...hackernewsHandlers];
