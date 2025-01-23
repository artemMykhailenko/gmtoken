// WalletContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

interface WalletContextType {
  walletAddress: string;
  balance: string;
  twitterUsername: string;
  updateWalletInfo: (address: string) => void;
}

const WalletContext = createContext<WalletContextType>({
  walletAddress: "",
  balance: "",
  twitterUsername: "",
  updateWalletInfo: () => {},
});

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("walletAddress") || "";
    }
    return "";
  });

  const [balance, setBalance] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("walletBalance") || "";
    }
    return "";
  });

  const [twitterUsername, setTwitterUsername] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("twitterUsername") || "";
    }
    return "";
  });

  const fetchBalance = async (address: string) => {
    if (!address || address === "Not connected") return;
    try {
      //@ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceBigInt = await provider.getBalance(address);
      const formattedBalance = ethers.formatEther(balanceBigInt);
      const balanceToSet = `${formattedBalance.slice(0, 6)} ETH`;
      setBalance(balanceToSet);
      localStorage.setItem("walletBalance", balanceToSet);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("Error");
      localStorage.setItem("walletBalance", "Error");
    }
  };

  const updateWalletInfo = async (address: string) => {
    setWalletAddress(address);
    localStorage.setItem("walletAddress", address);
    await Promise.all([fetchBalance(address)]);
  };

  return (
    <WalletContext.Provider
      value={{ walletAddress, balance, twitterUsername, updateWalletInfo }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
