// frontend/src/types/ethereum.d.ts

//Define the TypeScript data structures
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  selectedAddress?: string;
  chainId?: string;
  isMetaMask?: boolean;
}

interface Window {
  ethereum?: EthereumProvider;
}
