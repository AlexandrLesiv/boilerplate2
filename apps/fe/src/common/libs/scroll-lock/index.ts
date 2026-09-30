import { scrollLocked } from '@/assets/styles/scroll-lock.css';

// Measured before `scrollLocked` is applied, not after — that class sets `overflow: hidden`, which
// removes the native scrollbar, so measuring afterward always reads ~0 regardless of whether the
// page actually had one.
//
// `document.body.clientWidth`, not `document.documentElement.clientWidth` — the latter is a CSSOM
// special case for the root element that always reports the viewport width, unaffected by
// `scrollbar-gutter: stable`'s own reservation on itself. Verified live: on a page too short to
// scroll, `innerWidth - documentElement.clientWidth` reads `0` even though the reserved gutter
// (and the layout shift from removing it) is real — `body`, a normal element, reports the reduced
// width correctly in both cases.
export const lockScroll = () => {
  const gutterWidth = Math.floor(window.innerWidth - document.body.clientWidth);
  document.documentElement.classList.add(scrollLocked);
  document.body.style.paddingRight = `${gutterWidth}px`;
};

export const unlockScroll = () => {
  document.documentElement.classList.remove(scrollLocked);
  document.body.style.paddingRight = '';
};
