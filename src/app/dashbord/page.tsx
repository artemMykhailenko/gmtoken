"use client";
import React, { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { useWallet } from "@/src/context/WalletContext";
import { useWeb3 } from "@/src/hooks/useWeb3";
import { useRouter } from "next/navigation";
import { ethers, Contract } from "ethers";
import { TOKEN_URL } from "@/src/config";
// ✅ Адрес контракта токена
const CONTRACT_ADDRESS = "0x05694e4A34e5f6f8504fC2b2cbe67Db523e0fCCb";

// ✅ ABI для чтения баланса токена (ERC-20 `balanceOf`)
const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const Dashboard = () => {
  const { walletAddress } = useWallet();
  const { disconnect: web3Disconnect, getProvider } = useWeb3();
  const { updateWalletInfo } = useWallet();
  const router = useRouter();
  const [twitterName, setTwitterName] = useState<string>("");

  const [username, setUsername] = useState("@username");
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("verifier") || "";
    }
    return "";
  });

  const [code, setCode] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("code") || "";
    }
    return "";
  });
  useEffect(() => {
    const storedUser = sessionStorage.getItem("verifier");
    const storedCode = sessionStorage.getItem("code");
    if (storedUser && storedCode) {
      setUser(storedUser);
      setCode(storedCode);
    }
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem("twitterName");
    if (storedUsername) {
      setTwitterName(
        storedUsername.startsWith("@") ? storedUsername : `@${storedUsername}`
      );
    }
  }, []);
  // ✅ Функция загрузки баланса токена
  const loadTokenBalance = async () => {
    if (!walletAddress) return;
    setIsLoading(true);

    try {
      //@ts-ignore
      const provider = getProvider();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Получаем баланс токена
      const rawBalance = await contract.balanceOf(walletAddress);
      const decimals = await contract.decimals();

      // Приводим баланс к нормальному виду
      const formattedBalance = ethers.formatUnits(rawBalance, decimals);
      setTokenBalance(formattedBalance);
    } catch (error) {
      console.error("Ошибка загрузки баланса токена:", error);
      setTokenBalance("Error");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (walletAddress) {
      loadTokenBalance();
    }
  }, [walletAddress]);

  const handleDisconnect = async () => {
    try {
      await web3Disconnect();
      updateWalletInfo("");
      router.push("/");
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  const formatAddress = (address: string) => {
    if (!address || address === "Please connect wallet")
      return "Please connect wallet";
    return `${address.slice(0, 10)}...${address.slice(-4)}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <div className={styles.cosmoman}>
          <img src="/cosmoman.png" alt="Cosmoman" />
        </div>

        <div className={styles.cloude}>
          <p className={styles.username}>{twitterName || username}</p>
          <div className={styles.addressContainer}>
            <p>{formatAddress(walletAddress)}</p>
            <button
              className={`${styles.iconButton} ${styles.disconnectButton}`}
              onClick={handleDisconnect}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 3H6a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h4" />
                <path d="M18 8l4 4-4 4" />
                <path d="M22 12H10" />
              </svg>
            </button>
          </div>
          <div className={styles.balanceContainer}>
            <p className={styles.balance}>
              {isLoading
                ? "Loading..."
                : tokenBalance
                ? `${tokenBalance} GM`
                : "0 GM"}
            </p>
            <button
              className={`${styles.iconButton} ${styles.refreshButton}`}
              onClick={loadTokenBalance}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.9 3.2L21 9" />
                <path d="M21 3v6h-6" />
                <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.9-3.2L3 15" />
                <path d="M3 21v-6h6" />
              </svg>
            </button>
          </div>
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

export default Dashboard;
