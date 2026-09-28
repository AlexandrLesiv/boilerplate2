import type { Component } from 'solid-js';

import type { ErrorKind } from '../kinds';
import { Error400 } from './Error400';
import { Error401 } from './Error401';
import { Error403 } from './Error403';
import { Error404 } from './Error404';
import { Error408 } from './Error408';
import { Error429 } from './Error429';
import { Error500 } from './Error500';
import { Error501 } from './Error501';
import { Error502 } from './Error502';
import { Error503 } from './Error503';
import { Error504 } from './Error504';
import { ErrorOffline } from './ErrorOffline';
import { ErrorUnknown } from './ErrorUnknown';
import type { ErrorPageProps } from './types';

/** Typed as a total record, so adding a kind without a component is a type error. */
export const ERROR_PAGES: Record<ErrorKind, Component<ErrorPageProps>> = {
  '400': Error400,
  '401': Error401,
  '403': Error403,
  '404': Error404,
  '408': Error408,
  '429': Error429,
  '500': Error500,
  '501': Error501,
  '502': Error502,
  '503': Error503,
  '504': Error504,
  offline: ErrorOffline,
  unknown: ErrorUnknown,
};

export type { ErrorPageProps } from './types';
