/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_NETWORK: string;
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_GOVERNANCE_ADDRESS: string;
  readonly VITE_SCHOLACHAIN_ADDRESS: string;
  readonly VITE_MINISTRY_ADDRESS: string;
  // ajoutez d'autres variables d'environnement ici...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
