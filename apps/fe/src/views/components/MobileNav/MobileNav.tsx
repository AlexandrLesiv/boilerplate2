import type { Component, JSX } from 'solid-js';
import { createEffect, createSignal, createUniqueId, onCleanup, Show } from 'solid-js';

import * as styles from './styles.css';

export interface MobileNavProps {
  // Labels both the toggle button and the `<nav>` landmark itself — state (expanded/collapsed)
  // is communicated separately via `aria-expanded`, not by changing this text. See
  // MobileNav/AGENTS.md.
  label: string;
  // Plain `JSX.Element`, not a function — unlike `Dialog`'s `children`, nothing here is ever
  // unmounted; the links stay in the DOM at every breakpoint and open state, only `display`
  // changes. See MobileNav/AGENTS.md.
  children: JSX.Element;
}

/**
 * Wraps a set of nav links so they render as a normal horizontal row at `sm` and above, and
 * collapse behind a toggle button below it — one `<nav>`, not two separate "desktop"/"mobile"
 * copies. See MobileNav/AGENTS.md.
 */
export const MobileNav: Component<MobileNavProps> = (props) => {
  const [open, setOpen] = createSignal(false);
  const navId = createUniqueId();
  let wrapperRef: HTMLDivElement | undefined;
  let toggleRef: HTMLButtonElement | undefined;

  // Escape and outside-click listeners are only attached while open — re-armed every time
  // `open()` goes true, rather than attached unconditionally for the component's whole lifetime.
  createEffect(() => {
    if (!open()) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (wrapperRef && !wrapperRef.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef?.focus();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  // Delegated, not one `onClick` per link — callers shouldn't need to know this component closes
  // itself on navigation just to pass the right handler to every link.
  const handleNavClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  };

  return (
    <div ref={(el) => (wrapperRef = el)} class={styles.wrapper}>
      <button
        type="button"
        ref={(el) => (toggleRef = el)}
        class={styles.toggle}
        aria-expanded={open() ? 'true' : 'false'}
        aria-controls={navId}
        aria-label={props.label}
        onClick={() => setOpen(!open())}
      >
        <svg
          aria-hidden="true"
          class={styles.toggleIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <Show when={open()} fallback={<path d="M3 6h18M3 12h18M3 18h18" />}>
            <path d="M18 6 6 18M6 6l12 12" />
          </Show>
        </svg>
      </button>
      <nav
        id={navId}
        aria-label={props.label}
        class={styles.nav}
        data-open={open() ? 'true' : undefined}
        onClick={handleNavClick}
      >
        {props.children}
      </nav>
    </div>
  );
};
