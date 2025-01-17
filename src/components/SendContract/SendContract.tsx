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
  const router = useRouter();

  useEffect(() => {
    setWallet(walletAddress);
  }, [walletAddress]);

  const isFormValid = wallet.trim() !== "" && username.trim() !== "";

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
      setErrorMessage("Please switch to Base Sepolia network");
      setModalState("error");
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
        <img src="/image/contract/rainbow.png" alt="Rainbow" />
      </div>
      <div className={styles.balloon}>
        <img src="/image/contract/ballon.png" alt="Hot Air Balloon" />
      </div>

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
          {wallet && (
            <span className={styles.clear} onClick={() => setWallet("")}>
              ✖
            </span>
          )}
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
