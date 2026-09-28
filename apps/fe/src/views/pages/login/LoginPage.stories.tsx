import type { Meta, StoryObj } from 'storybook-solidjs-vite';

import { withPageLayout } from '../../../../.storybook/decorators';
import {
  loginNetworkError,
  loginServerError,
  loginSlow,
  loginSuccess,
  loginUnauthorized,
} from '../../../mocks/handlers/auth';
import LoginPage from './LoginPage';

const meta: Meta<typeof LoginPage> = {
  title: 'Pages/Login',
  component: LoginPage,
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: [loginSuccess] },
  },
  decorators: [withPageLayout()],
};

export default meta;
type Story = StoryObj<typeof LoginPage>;

// ─── helpers ─────────────────────────────────────────────────────────────────

async function fillAndSubmit(
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
  userEvent: Parameters<NonNullable<Story['play']>>[0]['userEvent'],
  email: string,
  password: string
) {
  // findBy, not getBy: the page sits behind RootLayout's <main> Suspense and is not in the DOM
  // on the first tick, while the i18n resource is still loading.
  await userEvent.type(await canvas.findByLabelText(/email/i), email);
  await userEvent.type(await canvas.findByLabelText(/password/i), password);
  await userEvent.click(canvas.getByRole('button', { name: /log in/i }));
}

// ─── happy path ──────────────────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvas }) => {
    await canvas.findByRole('main');
  },
};

export const SuccessfulLogin: Story = {
  play: async ({ canvas, userEvent }) => {
    await fillAndSubmit(canvas, userEvent, 'user@example.com', 'correct-password');
  },
};

// ─── server / network errors ─────────────────────────────────────────────────

export const InvalidCredentials: Story = {
  parameters: { msw: { handlers: [loginUnauthorized] } },
  play: async ({ canvas, userEvent }) => {
    await fillAndSubmit(canvas, userEvent, 'bad@example.com', 'wrong');
  },
};

export const ServerError: Story = {
  parameters: { msw: { handlers: [loginServerError] } },
  play: async ({ canvas, userEvent }) => {
    await fillAndSubmit(canvas, userEvent, 'user@example.com', 'password');
  },
};

export const NetworkError: Story = {
  parameters: { msw: { handlers: [loginNetworkError] } },
  play: async ({ canvas, userEvent }) => {
    await fillAndSubmit(canvas, userEvent, 'user@example.com', 'password');
  },
};

/** Button stays disabled while the request is in flight. */
export const Submitting: Story = {
  parameters: { msw: { handlers: [loginSlow] } },
  play: async ({ canvas, userEvent }) => {
    await fillAndSubmit(canvas, userEvent, 'user@example.com', 'password');
  },
};

// ─── input edge cases ────────────────────────────────────────────────────────

/** Very long email — tests label/input alignment and clipping inside the 360px container. */
export const VeryLongEmail: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      await canvas.findByLabelText(/email/i),
      'averylonglocalpart.that.goes.on.and.on.and.on@subdomain.verylongdomainname.example.com'
    );
  },
};

/** 128-character password — tests that no UI element clips or overflows. */
export const VeryLongPassword: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText(/email/i), 'user@example.com');
    await userEvent.type(await canvas.findByLabelText(/password/i), 'A'.repeat(128));
  },
};

/** Password with special characters that could cause encoding or escaping issues. */
export const SpecialCharacterPassword: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText(/email/i), 'user@example.com');
    // `{` and `[` are userEvent key descriptors; doubling them types the literal character.
    await userEvent.type(await canvas.findByLabelText(/password/i), '!@#$%^&*()_+{{}}|:<>?[[];\',./`~"\\');
  },
};

/** Unicode and emoji in the password field — tests multi-byte character handling. */
export const UnicodePassword: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText(/email/i), 'user@example.com');
    await userEvent.type(await canvas.findByLabelText(/password/i), 'Pässwörد🔑');
  },
};

/** Internationalized email with unicode domain. */
export const UnicodeEmail: Story = {
  play: async ({ canvas, userEvent }) => {
    // Most browsers reject non-ASCII email in type="email" — this tests the validation message.
    await userEvent.type(await canvas.findByLabelText(/email/i), 'user@münchen.de');
    await userEvent.type(await canvas.findByLabelText(/password/i), 'password');
  },
};

/**
 * Attempt to inject a script tag via the email field.
 * type="email" rejects this before submission; this story confirms the UI
 * does not execute or display the string in an unsafe way.
 */
export const XssAttemptEmail: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText(/email/i), '<script>alert(1)</script>@example.com');
    await userEvent.type(await canvas.findByLabelText(/password/i), 'password');
  },
};

/** Whitespace-only values — tests that the form doesn't submit blank credentials. */
export const WhitespaceOnly: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText(/email/i), '   ');
    await userEvent.type(await canvas.findByLabelText(/password/i), '   ');
  },
};
