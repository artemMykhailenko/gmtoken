export interface WalletState {
    accounts: Array<{ address: string }>;
    chains?: Array<Chain>;
  }
  
  export interface Chain {
    id: string;
    token: string;
    label: string;
    rpcUrl: string;
  }
  
  export interface TwitterConnectProps {
    onConnectClick: () => Promise<void>;
    isConnecting: boolean;
  }
  
  export interface Web3Config {
    contractAddress: string;
    contractAbi: string[];
    apiUrl: string;
  }