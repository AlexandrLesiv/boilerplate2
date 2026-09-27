import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';

import { responsiveBreakPoints } from './responsive/breakpoints';

const space = {
  none: '0',
  small: '4px',
  medium: '8px',
  large: '16px',
} as const;

type BreakpointValue = string | 0;

const responsiveCondition = Object.fromEntries(
  (Object.entries(responsiveBreakPoints) as [string, BreakpointValue][]).map(([key, value]) => [
    key,
    value ? { '@media': `screen and (min-width: ${value})` } : {},
  ])
) as { [K in keyof typeof responsiveBreakPoints]: { '@media'?: string } };

const responsiveProperties = defineProperties({
  conditions: responsiveCondition,
  defaultCondition: 'xsm',
  properties: {
    display: ['none', 'flex', 'block', 'inline', 'inline-flex', 'inline-block', 'grid'],
    flexDirection: ['row', 'column'],
    justifyContent: ['flex-start', 'center', 'flex-end', 'space-around', 'space-between'],
    alignItems: ['stretch', 'flex-start', 'center', 'flex-end'],
    cursor: ['pointer', 'default', 'text'],
    userSelect: ['all', 'auto', 'none', 'text'] as const,
    textAlign: ['center', 'justify', 'left', 'right'],
    position: ['absolute', 'fixed', 'relative', 'sticky'],
    marginTop: space,
    marginBottom: space,
    marginLeft: space,
    marginRight: space,
    paddingTop: space,
    paddingBottom: space,
    paddingLeft: space,
    paddingRight: space,
  },
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    margin: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
    marginX: ['marginLeft', 'marginRight'],
    marginY: ['marginBottom', 'marginTop'],
    paddingX: ['paddingLeft', 'paddingRight'],
    paddingY: ['paddingTop', 'paddingBottom'],
    placeItems: ['justifyContent', 'alignItems'],
  },
});

export const styleContainer = createSprinkles(responsiveProperties);
export type StyleContainer = Parameters<typeof styleContainer>[0];
