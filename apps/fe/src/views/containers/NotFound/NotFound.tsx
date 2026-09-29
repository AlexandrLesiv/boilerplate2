import type { Component } from 'solid-js';

import { ErrorState } from '../ErrorState/ErrorState';

/** The 404 page. Kept as a named component because that is what routes reach for. */
export const NotFound: Component = () => <ErrorState kind="404" />;
