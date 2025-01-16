import React, { useEffect, useState } from "react";
import styles from "./SendContract.module.css";
import ButtonBackground from "../buttons/BlueButton";

interface SendContractProps {
  connectedWallet: { accounts: { address: string }[] } | null;
  sendTransaction: () => Promise<void>;
  walletAddress: string;
}

const SendContract: React.FC<SendContractProps> = ({
  connectedWallet,
  walletAddress,
  sendTransaction,
}) => {
  const [wallet, setWallet] = useState(walletAddress);
  const [username, setUsername] = useState("");
  useEffect(() => {
    setWallet(walletAddress); // Обновляем адрес кошелька при изменении пропсов
  }, [walletAddress]);
  return (
    <div className={styles.container}>
      {/* Радуга */}
      <div className={styles.rainbow}>
        <img src="/image/contract/rainbow.png" alt="Hot Air Balloon" />
      </div>

      {/* Воздушный шар */}
      <div className={styles.balloon}>
        <img src="/image/contract/ballon.png" alt="Hot Air Balloon" />
      </div>

      {/* Форма для ввода данных */}
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
          <span className={styles.clear} onClick={() => setWallet("")}>
            ✖
          </span>
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
          <span className={styles.clear} onClick={() => setUsername("")}>
            ✖
          </span>
          <div className={styles.sparkles}></div>
        </div>

        {/* Кнопка отправки */}
        <div className={styles.buttonContainer}>
          <button
            className={`${styles.createButton} ${styles.buttonAnimation}`}
            onClick={sendTransaction}
          >
            <ButtonBackground />
            <span className={styles.buttonText}>SEND</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendContract;
