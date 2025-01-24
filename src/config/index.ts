export const CONTRACT_ADDRESS = "0x05694e4A34e5f6f8504fC2b2cbe67Db523e0fCCb";
export const TWITTER_CLIENT_ID = "WHZUSzBwWW5HOTliMDk5ZTdyMG86MTpjaQ";
export const CONTRACT_ABI = [
  "function requestTwitterVerification(string calldata authCode, string calldata verifier, bool autoFollow) public",
  "event TwitterConnected(string indexed userID, address indexed wallet)",
  "event TwitterConnectError(address indexed wallet, string errorMsg)",
  "function userByWallet(address wallet) public view returns (string memory)",
];

// export const  API_URL = "https://ue63semz7f.execute-api.eu-central-1.amazonaws.com/default/GMRelayer";
export const  API_URL = "https://ue63semz7f.execute-api.eu-central-1.amazonaws.com/testnet/GMRelayer"; //testnet
// export const  API_URL = "https://ue63semz7f.execute-api.eu-central-1.amazonaws.com/mainnet/GMRelayer"; //mainnet
// export const  TOKEN_URL="https://ue63semz7f.execute-api.eu-central-1.amazonaws.com/dev/TwitterAccessToken"
//export const  TOKEN_URL="https://ue63semz7f.execute-api.eu-central-1.amazonaws.com/mainnet/TwitterAccessToken" //mainet
export const TOKEN_URL="https://ue63semz7f.execute-api.eu-central-1.amazonaws.com/testnet/TwitterAccessToken" //testnet

export const CHAINS = [
  {
    id: "0x14a34",
    token: "ETH",
    label: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
  },
  {
    id: "0x2105",
    token: "ETH",
    label: "Base",
    rpcUrl: "https://mainnet.base.org",
  },
];