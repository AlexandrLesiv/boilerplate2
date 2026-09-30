import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { expect } from 'storybook/test';

import { withAppProviders } from '../../../../.storybook/decorators';
import { loginSuccess } from '../../../../.storybook/mocks/handlers/auth';
import { LoginDialog } from './LoginDialog';

const meta: Meta<typeof LoginDialog> = {
  title: 'Containers/LoginDialog',
  component: LoginDialog,
  decorators: [withAppProviders()],
  parameters: {
    msw: { handlers: [loginSuccess] },
    // Not promoted to `test: 'error'`: `AppButton`'s primary variant fails axe's color-contrast
    // check (3.67:1, needs 4.5:1) wherever it renders, including here — a pre-existing design-system
    // issue, not something LoginDialog introduces. Fix that in AppButton's own tokens first.
  },
};

export default meta;
type Story = StoryObj<typeof LoginDialog>;

// See Dialog.stories.tsx's `isDialogOpen` for why `queryByRole('dialog')` alone can't tell a closed
// dialog from an open one in this test environment.
const isDialogOpen = (canvas: { getByRole: (role: string, opts?: { hidden?: boolean }) => Element }): boolean =>
  canvas.getByRole('dialog', { hidden: true }).hasAttribute('open');

/** Signed out: shows the "Login" trigger, dialog closed. */
export const LoggedOut: Story = {
  play: async ({ canvas }) => {
    await canvas.findByRole('button', { name: 'Login' });
    await expect(isDialogOpen(canvas)).toBe(false);
  },
};

export const OpensDialog: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Login' }));
    await canvas.findByRole('dialog');
    await canvas.findByLabelText(/email/i);
  },
};

/** A successful submission closes the dialog and swaps the trigger for the account status. */
export const SuccessfulLoginClosesDialogAndSwapsToAccount: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Login' }));
    await userEvent.type(await canvas.findByLabelText(/email/i), 'user@example.com');
    await userEvent.type(await canvas.findByLabelText(/password/i), 'correct-password');
    await userEvent.click(canvas.getByRole('button', { name: /log in/i }));
    // Waiting on this implicitly waits out the login mutation — setUser and the dialog's onSuccess
    // close both happen synchronously right after it resolves, in the same tick.
    await canvas.findByText('user@example.com');
    await canvas.findByRole('button', { name: 'Log out' });
    // Not `isDialogOpen`: logging in swaps the `<Show>` branch entirely, so the `<dialog>` element
    // itself is gone, not just closed — there's no "closed but present" ambiguity to guard against
    // here the way there is while the same Dialog instance just toggles open/closed in place.
    await expect(canvas.queryByRole('dialog')).toBeNull();
  },
};

/** Signed in: shows the account email and a "Log out" action instead of the trigger. */
export const LoggedIn: Story = {
  decorators: [withAppProviders({ user: { id: '1', email: 'user@example.com' } })],
  play: async ({ canvas }) => {
    await canvas.findByText('user@example.com');
    await expect(canvas.queryByRole('button', { name: 'Login' })).toBeNull();
  },
};

export const LogoutReturnsToLoginTrigger: Story = {
  decorators: [withAppProviders({ user: { id: '1', email: 'user@example.com' } })],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Log out' }));
    await canvas.findByRole('button', { name: 'Login' });
    await expect(canvas.queryByText('user@example.com')).toBeNull();
  },
};
