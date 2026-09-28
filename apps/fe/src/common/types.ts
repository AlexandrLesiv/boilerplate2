import type { Accessor, JSX } from 'solid-js';

/**
 * Signature for any prop that renders reactive data — `DataBoundary`'s `children`, and anything
 * like it added later.
 *
 * It must hand the consumer an **accessor**, never the value. Taking `T` directly makes Solid
 * re-run the callback on every change and rebuild the whole subtree instead of updating the parts
 * that moved. Nothing catches that automatically: it type-checks, it lints clean, and it renders
 * correctly — it is only slow. Using this alias makes the value form a compile error at every call
 * site, which is the actual guard.
 */
export type RenderProp<T> = (value: Accessor<T>) => JSX.Element;
