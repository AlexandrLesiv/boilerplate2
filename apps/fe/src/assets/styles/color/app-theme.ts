export interface AppTheme {
  primary: string;
  primaryHover: string;
  primaryContrast: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textSecondary: string;
  error: string;
  success: string;
}

export const defineColorTheme = <T extends AppTheme>(theme: T): T => theme;
