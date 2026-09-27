import { http, HttpResponse } from 'msw';
import { loginRoute } from '@repo/shared';

const url = `*${loginRoute.url}`;

export const loginSuccess = http.post(url, () =>
  HttpResponse.json({ data: { id: '1', email: 'user@example.com' } }),
);

export const loginUnauthorized = http.post(url, () =>
  HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 }),
);

export const loginServerError = http.post(url, () =>
  HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 }),
);

export const loginNetworkError = http.post(url, () => HttpResponse.error());

export const loginSlow = http.post(url, async () => {
  await new Promise<void>((resolve) => setTimeout(resolve, 60_000));
  return HttpResponse.json({ data: { id: '1', email: 'user@example.com' } });
});

export const authHandlers = [loginSuccess];
