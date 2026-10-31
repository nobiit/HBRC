interface ImportMetaEnv {
  readonly MAIN_VITE_DEV_TUNNEL_URL?: string;
  readonly MAIN_VITE_TRANSPORTER_INSECURE_TLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
