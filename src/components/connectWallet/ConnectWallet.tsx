// ConnectWallet.tsx
import React from "react";
import styles from "./ConnectWallet.module.css";
import ButtonBackground from "../buttons/BlueButton";
import ButtonYellow from "../buttons/YellowButton";

interface AuthComponentProps {
  onConnect?: () => void;
  createAmbireWallet?: () => void;
}

const ConnectWallet: React.FC<AuthComponentProps> = ({
  onConnect,
  createAmbireWallet,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.airship}>
          <img src="/image/wallet/airship.png" alt="Airship" />
        </div>
      </div>
      <svg
        className={styles.rope}
        width="500"
        height="200"
        viewBox="0 0 500 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M50 50 C150 150, 300 0, 450 150" />
      </svg>
      <div className={styles.body}>
        <div className={styles.buttonContainer}>
          <button
            className={`${styles.connectButton} ${styles.buttonAnimation}`}
            onClick={onConnect}
          >
            <ButtonYellow />
            <span className={styles.buttonText}>CONNECT WALLET</span>
          </button>
        </div>
        <span className={styles.withText}>OR</span>
        <div className={styles.buttonContainer}>
          <button
            className={`${styles.createButton} ${styles.buttonAnimation}`}
            onClick={createAmbireWallet}
          >
            <ButtonBackground />
            <span className={styles.buttonText}>CREATE WALLET</span>
          </button>
        </div>
      </div>

      <div className={styles.decorations}>
        <div className={styles.rainbow}>
          <img src="/image/wallet/rainbow.png" alt="Rainbow" />
        </div>

        <div className={styles.cloud1}>
          <img src="/image/wallet/cloud1.png" alt="Cloud1" />
        </div>

        <div className={styles.cloud2}>
          <img src="/image/wallet/cloud2.png" alt="Cloud2" />
        </div>
      </div>
    </div>
  );
};

export default ConnectWallet;
