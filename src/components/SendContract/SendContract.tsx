import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SendContract.module.css";
import ButtonBackground from "../buttons/BlueButton";
import { AlertCircle } from "lucide-react";
import Modal from "../modal/Modal";
import { ethers } from "ethers";

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
  const [username, setUsername] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [modalState, setModalState] = useState<
    "loading" | "error" | "success" | "wrongNetwork" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setWallet(walletAddress);
  }, [walletAddress]);

  const isFormValid = wallet.trim() !== "" && username.trim() !== "";

  const switchNetwork = async () => {
    try {
      //@ts-ignore
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x14a34" }], // 84532 in hex
      });
      setIsWrongNetwork(false);
      setModalState(null);
    } catch (switchError: any) {
      // This error code means the chain hasn't been added to MetaMask
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

  const handleSendTransaction = async () => {
    if (!isFormValid) return;

    if (!connectedWallet) {
      console.log("Wallet not connected. Trying to connect...");
      await connect();
      return;
    }

    // Check network
    //@ts-ignore
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (network.chainId.toString() !== "84532") {
      setIsWrongNetwork(true);
      setErrorMessage("Please switch to Base Sepolia network");
      setModalState("wrongNetwork");
      return;
    }

    setModalState("loading");

    try {
      await sendTransaction();
    } catch (error: any) {
      if (error?.code === 4001) {
        setErrorMessage("You cancelled the transaction. Please try again!");
      } else {
        setErrorMessage(`Error sending transaction`);
      }
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
      <p className={styles.title}>SEND TRANSACTIONS</p>
      <div className={styles.form}>
        <label className={styles.label}>ADRESS WALLET</label>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Enter Wallet..."
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className={styles.input}
            readOnly={!!connectedWallet}
          />
        </div>

        <label className={styles.label}>X USERNAME</label>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Enter Name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
          />
          {username && (
            <span className={styles.clear} onClick={() => setUsername("")}>
              ✖
            </span>
          )}
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
              <p>{errorMessage || "ERROR"}</p>
              <img src="/sad-sun.png" alt="Sun" className={styles.sadEmoji} />
            </div>
          )}

          {modalState === "success" && (
            <div className={styles.modalContent}>
              <p>🎉 Transaction successful!</p>
              <img src="/sun.png" alt="Sun" className={styles.goodEmoji} />
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
