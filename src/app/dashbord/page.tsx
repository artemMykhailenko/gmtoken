"use client";
import React, { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { useWallet } from "@/src/context/WalletContext";

const Dashboard = () => {
  const { walletAddress, balance } = useWallet();
  const [username, setUsername] = useState("@username");

  useEffect(() => {
    // Get username from localStorage when component mounts
    const storedUsername = localStorage.getItem("userUsername");
    if (storedUsername) {
      // Add @ if it doesn't exist at the start
      const formattedUsername = storedUsername.startsWith("@")
        ? storedUsername
        : `@${storedUsername}`;
      setUsername(formattedUsername);
    }
  }, []);
  const formatAddress = (address: string) => {
    if (!address || address === "Please connect wallet")
      return "Please connect wallet";
    return `${address.slice(0, 18)}...${address.slice(-4)}`;
  };
  const getUsernameFontClass = (username: string) => {
    if (username.length > 20) {
      return styles.smallFont;
    } else if (username.length > 16) {
      return styles.mediumFont;
    }
    return styles.normalFont;
  };
  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <div className={styles.cosmoman}>
          <img src="/cosmoman.png" alt="Cosmoman" />
        </div>

        {/* Облако с данными */}
        <div className={styles.cloude}>
          <p className={getUsernameFontClass(username)}>{username}</p>
          <p>{formatAddress(walletAddress)}</p>
          <p className={styles.balance}>{balance || "Loading..."}</p>
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
