import { useCallback } from 'react';
import { useWeb3 } from "@/src/hooks/useWeb3";
import { TOKEN_URL, TWITTER_CLIENT_ID } from "@/src/config";
import { generateCodeVerifier, generateCodeChallenge } from "@/src/utils/auth";

interface WalletActionsParams {
  connect: () => Promise<void>;
  setModalState: (state: "loading" | "error" | "success" | "wrongNetwork" | null) => void;
  setErrorMessage: (message: string | null) => void;
  setTwitterName?: (name: string | null) => void;
  setUser?: (user: string) => void;
  setIsWrongNetwork?: (state: boolean) => void;
}

export const useWalletActions = ({
  connect,
  setModalState,
  setErrorMessage,
  setTwitterName,
  setUser,
  setIsWrongNetwork
}: WalletActionsParams) => {
  const { disconnect } = useWeb3();

  const handleSwitchNetwork = useCallback(async () => {
    try {
      //@ts-ignore
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x14a34" }],
      });
      setIsWrongNetwork?.(false);
      setModalState(null);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          //@ts-ignore
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x14a34",
                chainName: "Base Sepolia",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.base.org"],
                blockExplorerUrls: ["https://sepolia.basescan.org"],
              },
            ],
          });
          setIsWrongNetwork?.(false);
          setModalState(null);
        } catch (addError) {
          setErrorMessage("Failed to add network to wallet");
          setModalState("error");
        }
      } else {
        setErrorMessage("Failed to switch network");
        setModalState("error");
      }
    }
  }, [setIsWrongNetwork, setModalState, setErrorMessage]);

  const handleReconnectWallet = useCallback(async (setWalletAdd:any) => {
    try {
        await disconnect();
        await connect();
        const walletAddress = localStorage.getItem("walletAddress");
        setWalletAdd(walletAddress || "");
        setModalState(null);
        return walletAddress;
      } catch (error) {
        setErrorMessage("Failed to reconnect wallet");
        setModalState("error");
      }
  }, [disconnect, connect, setModalState, setErrorMessage]);

  const handleReconnectTwitter = useCallback(async () => {
    try {
      sessionStorage.removeItem("code");
      sessionStorage.removeItem("verifier");
      setUser?.("");

      const codeVerifier = generateCodeVerifier();
      sessionStorage.setItem("verifier", codeVerifier);

      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const redirectUri = encodeURIComponent(
        window.location.origin + window.location.pathname
      );
      const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CLIENT_ID}&redirect_uri=${redirectUri}&scope=users.read%20tweet.read%20follows.write&state=state123&code_challenge=${codeChallenge}&code_challenge_method=S256`;

      window.location.href = twitterAuthUrl;
    } catch (error) {
      setErrorMessage("Failed to reconnect Twitter");
      setModalState("error");
    }
  }, [setErrorMessage, setModalState, setUser]);

  const handleFetchTwitterAccessToken = useCallback(async (code: string, user: string) => {
    const url = TOKEN_URL;
    if (!url) {
      console.error("❌ TWITTER_ACCESS_TOKEN_URL is not defined in .env.local!");
      return;
    }
    try {
      const requestBody = {
        authCode: code,
        verifier: user,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setTwitterName?.(data.username);
      localStorage.setItem("twitterName", data.username);
      return data.username;
    } catch (error) {
      console.error("❌ Error fetching Twitter access token:", error);
    }
  }, [setTwitterName]);

  return {
    switchNetwork: handleSwitchNetwork,
    reconnectWallet: handleReconnectWallet,
    reconnectTwitter: handleReconnectTwitter,
    fetchTwitterAccessToken: handleFetchTwitterAccessToken
  };
};