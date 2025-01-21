// WalletContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { TWITTER_CLIENT_ID, CONTRACT_ADDRESS, CONTRACT_ABI } from "../config";

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

  const fetchTwitterInfo = async (address: string) => {
    if (!address || address === "Not connected") return;

    try {
      // Create contract instance
      //@ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      // Get Twitter ID from contract
      const twitterId = await contract.userByWallet(address);

      if (twitterId && twitterId !== "") {
        // Fetch Twitter username using the Twitter API
        try {
          const response = await fetch(
            `https://api.twitter.com/2/users/${twitterId}`,
            {
              headers: {
                Authorization: `Bearer ${TWITTER_CLIENT_ID}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Twitter API request failed");
          }

          const data = await response.json();
          const username = data.data.username;
          const formattedUsername = username.startsWith("@")
            ? username
            : `@${username}`;

          setTwitterUsername(formattedUsername);
          localStorage.setItem("twitterUsername", formattedUsername);
        } catch (twitterError) {
          console.error("Error fetching Twitter username:", twitterError);
          setTwitterUsername("@username");
          localStorage.setItem("twitterUsername", "@username");
        }
      } else {
        setTwitterUsername("@username");
        localStorage.setItem("twitterUsername", "@username");
      }
    } catch (error) {
      console.error("Error fetching Twitter ID from contract:", error);
      setTwitterUsername("@username");
      localStorage.setItem("twitterUsername", "@username");
    }
  };

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
    await Promise.all([fetchBalance(address), fetchTwitterInfo(address)]);
  };

  // useEffect(() => {
  //   if (typeof window !== "undefined" && window.ethereum) {
  //     window.ethereum.on("accountsChanged", (accounts: unknown) => {
  //       if (Array.isArray(accounts) && accounts.length > 0) {
  //         updateWalletInfo(accounts[0]);
  //       } else {
  //         setWalletAddress("");
  //         setBalance("");
  //         setTwitterUsername("@username");
  //         localStorage.removeItem("walletAddress");
  //         localStorage.removeItem("walletBalance");
  //         localStorage.removeItem("twitterUsername");
  //       }
  //     });
  //   }

  //   return () => {
  //     if (window.ethereum) {
  //       window.ethereum.removeAllListeners("accountsChanged");
  //     }
  //   };
  // }, []);

  return (
    <WalletContext.Provider
      value={{ walletAddress, balance, twitterUsername, updateWalletInfo }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
