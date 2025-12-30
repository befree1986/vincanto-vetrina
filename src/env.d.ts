/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_PAYPAL_CLIENT_ID?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly NODE_ENV?: string;
  readonly DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
