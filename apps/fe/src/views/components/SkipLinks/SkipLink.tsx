import type { Component } from 'solid-js';

import * as styles from './styles.css';

// solid-router's document-level click delegate intercepts every same-origin anchor click,
// including pure hash links, and its own scrollToHash only calls scrollIntoView — it never moves
// focus. preventDefault here (before the event bubbles to that listener, which bails out on
// evt.defaultPrevented) and focusing the target manually is what actually gets keyboard users there.
export const SkipLink: Component<{ targetId: string; label: string }> = (props) => {
  const focusTarget = (event: MouseEvent) => {
    event.preventDefault();
    document.getElementById(props.targetId)?.focus();
  };

  return (
    <a href={`#${props.targetId}`} class={styles.link} onClick={focusTarget}>
      {props.label}
    </a>
  );
};
