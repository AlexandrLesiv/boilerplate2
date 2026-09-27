import type { Component } from 'solid-js';

import { Router } from '@solidjs/router';

import { appRoutes } from './routes';

export const AppRouter: Component = () => <Router>{appRoutes}</Router>;
