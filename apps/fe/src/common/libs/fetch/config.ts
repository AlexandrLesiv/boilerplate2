export interface ApiConfig {
  getLocale?: () => string;
  getToken?: () => string | null;
}
