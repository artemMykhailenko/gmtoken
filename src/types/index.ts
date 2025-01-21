export interface WalletState {
    provider: any;
    accounts: Array<{ address: string }>;
    chains?: Array<Chain>;
    label:any
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