import { http, HttpResponse } from 'msw';

const LOGIN_URL = '*/api/auth/login';

export const loginSuccess = http.post(LOGIN_URL, () =>
  HttpResponse.json({ id: '1', email: 'user@example.com' }),
);

export const loginUnauthorized = http.post(LOGIN_URL, () =>
  HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 }),
);

export const loginServerError = http.post(LOGIN_URL, () =>
  HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 }),
);

export const loginNetworkError = http.post(LOGIN_URL, () => HttpResponse.error());

export const loginSlow = http.post(LOGIN_URL, async () => {
  await new Promise<void>((resolve) => setTimeout(resolve, 60_000));
  return HttpResponse.json({ id: '1', email: 'user@example.com' });
});

export const authHandlers = [loginSuccess];
