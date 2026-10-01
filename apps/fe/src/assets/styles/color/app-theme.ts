export interface AppTheme {
  primary: string;
  primaryHover: string;
  primaryContrast: string;
  /** Text-on-`surface` contrast, not `primary`/`primaryHover` — see `base.ts`'s comment for why
   * those two don't double as a safe link-text color in both themes. */
  linkText: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textSecondary: string;
  error: string;
  success: string;
}

export const defineColorTheme = <T extends AppTheme>(theme: T): T => theme;
