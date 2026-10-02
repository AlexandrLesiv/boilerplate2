import { defineRoute } from '@/common/libs/router';

import Root from './Root';

export const rootRoute = defineRoute({
  path: '',
  component: Root,
});
