import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SendContract.module.css";
import ButtonBackground from "../buttons/BlueButton";
import Modal from "../modal/Modal";
import { AlertCircle, RefreshCw } from "lucide-react";
import { generateCodeVerifier, generateCodeChallenge } from "@/src/utils/auth";
import { TOKEN_URL, TWITTER_CLIENT_ID } from "@/src/config";
import { useWeb3 } from "@/src/hooks/useWeb3";
interface SendContractProps {
  connectedWallet: { accounts: { address: string }[] } | null;
  sendTransaction: () => Promise<void>;
  walletAddress: string;
  connect: () => Promise<void>;
}

const SendContract: React.FC<SendContractProps> = ({
  connectedWallet,
  walletAddress,
  sendTransaction,
  connect,
}) => {
  const [wallet, setWallet] = useState(walletAddress);
  const [walletAdd, setWalletAdd] = useState(walletAddress);
  const { getProvider, disconnect } = useWeb3();
  const [showTooltip, setShowTooltip] = useState(false);
  const [modalState, setModalState] = useState<
    "loading" | "error" | "success" | "wrongNetwork" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [twitterName, setTwitterName] = useState<string | null>(
    sessionStorage.getItem("twitterName") || null
  );
  const [user, setUser] = useState(
    () => sessionStorage.getItem("verifier") || ""
  );
  const [code, setCode] = useState(() => sessionStorage.getItem("code") || "");
  const router = useRouter();

  useEffect(() => {
    if (walletAddress) {
      setWallet(walletAddress);
    }
  }, [walletAddress]);
  useEffect(() => {
    const storedUser = sessionStorage.getItem("verifier");
    const storedCode = sessionStorage.getItem("code");
    if (storedUser && storedCode) {
      setUser(storedUser);
      setCode(storedCode);
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("walletAddress");
      if (stored) {
        setWalletAdd(stored);
      }
    }
  }, []);
  useEffect(() => {
    if (user) {
      sessionStorage.setItem("verifier", user);
    }
  }, [user]);
  const isFormValid = walletAdd.trim() !== "";
  const formatAddress = (address: string) => {
    if (!address || address === "Please connect wallet")
      return "Please connect wallet";
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  };
  const reconnectWallet = async () => {
    try {
      await disconnect();
      await connect();
      setModalState(null);
      const stored = localStorage.getItem("walletAddress");
      if (stored) {
        setWalletAdd(stored);
      }
    } catch (error) {
      setErrorMessage("Failed to reconnect wallet");
      setModalState("error");
    }
  };
  const switchNetwork = async () => {
    try {
      //@ts-ignore
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x14a34" }],
      });
      setIsWrongNetwork(false);
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
          setIsWrongNetwork(false);
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
  };

  const fetchTwitterAccessToken = async () => {
    const url = TOKEN_URL;
    if (!url) {
      console.error(
        "❌ TWITTER_ACCESS_TOKEN_URL is not defined in .env.local!"
      );
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
          // Убираем Origin header - браузер добавит его автоматически
        },
        // Важно: не используем credentials: "include", если это не требуется явно
        // mode: 'cors', // Явно указываем режим CORS
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setTwitterName(data.username);
      sessionStorage.setItem("twitterName", data.twitterName);
    } catch (error) {
      console.error("❌ Error fetching Twitter access token:", error);
    }
  };
  useEffect(() => {
    fetchTwitterAccessToken();
  }, []);
  const handleSendTransaction = async () => {
    if (!isFormValid) return;

    if (!connectedWallet) {
      console.log("Wallet not connected. Trying to connect...");
      await connect();
      return;
    }
    try {
      //@ts-ignore
      const provider = getProvider();
      const network = await provider.getNetwork();

      if (network.chainId.toString() !== "84532") {
        setIsWrongNetwork(true);
        setErrorMessage("Please switch to Base Sepolia network");
        setModalState("wrongNetwork");
        return;
      }

      setModalState("loading");

      await sendTransaction();
      setModalState("success");
    } catch (error: any) {
      console.error("Transaction error:", error);

      if (error?.code === 4001 || error?.message?.includes("user denied")) {
        setErrorMessage("Transaction cancelled by user.");
        setModalState("error");
        return;
      }

      if (
        error?.message?.includes("insufficient funds") ||
        error?.message?.includes("Relayer service error")
      ) {
        setErrorMessage("Insufficient balance to process transaction.");
      } else if (error?.message?.includes("timeout")) {
        setErrorMessage("Transaction timed out. Please try again.");
      } else {
        setErrorMessage("Transaction failed. Please try again.");
      }

      setModalState("error");
    }
  };
  const reconnectTwitter = async () => {
    try {
      sessionStorage.removeItem("code");
      sessionStorage.removeItem("verifier");
      setUser("");

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
  };
  return (
    <div className={styles.container}>
      <div className={styles.rainbow}>
        <img src="/image/contract/rainbow.webp" alt="Rainbow" />
      </div>
      <div className={styles.balloon}>
        <img src="/image/contract/ballon.webp" alt="Hot Air Balloon" />
      </div>
      <p className={styles.title}>SEND TRANSACTION</p>
      <div className={styles.form}>
        <label className={styles.label}>ADRESS WALLET</label>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Enter Wallet..."
            value={formatAddress(walletAdd)}
            onChange={(e) => setWallet(e.target.value)}
            className={styles.input}
            readOnly={!!connectedWallet}
          />
          <button className={styles.reconnectButton} onClick={reconnectWallet}>
            <RefreshCw size={20} className={styles.reconnectIcon} /> reconnect
          </button>
        </div>
        <label className={styles.label}>NAME TWITTER</label>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Enter Wallet..."
            value={formatAddress(twitterName || user)}
            onChange={(e) => setUser(e.target.value)}
            className={styles.input}
            readOnly={!!connectedWallet}
          />
          <button className={styles.reconnectButton} onClick={reconnectTwitter}>
            <RefreshCw size={20} className={styles.reconnectIcon} /> reconnect
          </button>
        </div>

        <div className={styles.buttonContainer}>
          <div
            className={styles.buttonWrapper}
            onMouseEnter={() => !isFormValid && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button
              className={styles.createButton}
              onClick={handleSendTransaction}
              disabled={!isFormValid}
            >
              <ButtonBackground />
              <span className={styles.buttonText}>SEND</span>
            </button>
            {showTooltip && !isFormValid && (
              <div className={`${styles.tooltip} ${styles.tooltipVisible}`}>
                <span className={styles.tooltipIcon}>
                  <AlertCircle size={16} />
                </span>
                <span className={styles.tooltipText}>
                  Please fill in all fields
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalState && (
        <Modal onClose={() => setModalState(null)}>
          {modalState === "loading" && (
            <div className={styles.modalContent}>
              <p>Transaction in progress...</p>
              <div className={styles.loadingContainer}>
                <div className={styles.loadingText}>
                  <span>S</span>
                  <span>E</span>
                  <span>N</span>
                  <span>D</span>
                  <span>I</span>
                  <span>N</span>
                  <span>G</span>
                </div>
              </div>
            </div>
          )}

          {modalState === "wrongNetwork" && (
            <div className={styles.modalContent}>
              <p>{errorMessage}</p>
              <div className={styles.switchNetworkButton}>
                <button
                  className={styles.successButton}
                  onClick={switchNetwork}
                >
                  <span className={styles.buttonText}>SWITCH NETWORK</span>
                </button>
              </div>
            </div>
          )}

          {modalState === "error" && (
            <div className={styles.modalContent}>
              <div className={styles.errorContainer}>
                <img
                  src="/sad-sun.png"
                  alt="Error"
                  className={styles.sadEmoji}
                />
                <h3 className={styles.errorTitle}>
                  {errorMessage === "Transaction cancelled"
                    ? "Transaction Cancelled"
                    : "Transaction Failed"}
                </h3>
                <p className={styles.errorMessage}>
                  {errorMessage === "Transaction cancelled"
                    ? "You cancelled the transaction. Would you like to try again?"
                    : errorMessage}
                </p>
              </div>
              <button
                className={styles.tryButton}
                onClick={() => {
                  setModalState(null);
                  setErrorMessage(null);
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {modalState === "success" && (
            <div className={styles.modalContent}>
              <p>
                🎉 Well done!
                <br /> Now you’re in. You can go to Twitter and write “GM”.
                You'll receive GM coins for every tweet with "GM" word.
                <br /> Use hashtags and cashtags to get even more coins.
              </p>
              <img src="/sun.png" alt="Sun" className={styles.goodEmoji} />
              <a
                className={styles.twittButton}
                href="https://twitter.com/intent/tweet?text=Hello%20world"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className={styles.icon}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
                Tweet
              </a>
              <a
                className={styles.twittButton}
                href="https://twitter.com/TwitterDev"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className={styles.icon}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13h-1v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                </svg>
                Follow @TwitterDev
              </a>

              <button
                className={styles.successButton}
                onClick={() => router.push("/dashbord")}
              >
                GO TO DASHBOARD 🚀
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default SendContract;
