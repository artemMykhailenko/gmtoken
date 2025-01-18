/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useEffect, useState } from "react";
import { ethers, Contract } from "ethers";
import { useWeb3 } from "@/src/hooks/useWeb3";
import TwitterConnect from "@/src/components/TwitterConnect";
import { generateCodeVerifier, generateCodeChallenge } from "@/src/utils/auth";
import styles from "./page.module.css";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  API_URL,
  TWITTER_CLIENT_ID,
} from "@/src/config";
import ConnectWallet from "../components/connectWallet/ConnectWallet";
import SendContract from "../components/SendContract/SendContract";
import SunLoader from "../components/loader/loader";
import { useWallet } from "../context/WalletContext";
import ProgressNavigation from "../components/ProgressNavigation/ProgressNavigation";

export default function Home() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [previousStep, setPreviousStep] = useState(0);
  const [isTwitterConnected, setIsTwitterConnected] = useState(false);
  const [isTwitterLoading, setIsTwitterLoading] = useState(true);
  const [isTransactionSent, setIsTransactionSent] = useState(false);
  const [isEventReceived, setIsEventReceived] = useState(false);
  const [transactionError, setTransactionError] = useState("");
  const { connectedWallet, connect, createAmbireWallet, disconnect } =
    useWeb3(); // Add disconnect from useWeb3
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { updateWalletInfo } = useWallet();

  useEffect(() => {
    if (connectedWallet?.accounts[0]?.address) {
      updateWalletInfo(connectedWallet.accounts[0].address);
    }
  }, [connectedWallet]);
  useEffect(() => {
    const checkTwitterAuth = () => {
      // Сначала проверяем URL параметры
      const params = new URLSearchParams(window.location.search);
      const authorizationCode = params.get("code");

      if (authorizationCode) {
        console.log("Found authorization code in URL");
        setIsTwitterConnected(true);
        sessionStorage.setItem("code", authorizationCode);

        // Очищаем URL
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } else {
        // Если нет кода в URL, проверяем sessionStorage
        const storedCode = sessionStorage.getItem("code");
        console.log(
          "Checking stored code:",
          storedCode ? "exists" : "not found"
        );
        if (storedCode) {
          setIsTwitterConnected(true);
        }
      }
      setIsTwitterLoading(false); // Загрузка завершена
    };

    checkTwitterAuth();
  }, []);

  const openTwitterAuthPopup = async () => {
    if (typeof window === "undefined") return;

    setIsTwitterLoading(true); // Начинаем загрузку
    const codeVerifier = generateCodeVerifier();
    sessionStorage.setItem("verifier", codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);
    console.log("Generated challenge:", codeChallenge);

    const redirectUri = encodeURIComponent(
      window.location.origin + window.location.pathname
    );
    const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CLIENT_ID}&redirect_uri=${redirectUri}&scope=users.read%20tweet.read%20follows.write&state=state123&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    window.location.href = twitterAuthUrl;
  };
  const sendTransaction = async (): Promise<void> => {
    if (!connectedWallet) {
      console.log("❌ Wallet is not connected. Connecting...");
      await connect();
      return;
    }

    const code = sessionStorage.getItem("code");
    const verifier = sessionStorage.getItem("verifier");

    if (!code || !verifier) {
      setErrorMessage("Missing authentication data.");
      setTransactionStatus("error");
      return;
    }

    try {
      setTransactionStatus("pending");
      console.log("🚀 Sending transaction...");

      const browserProvider = new ethers.BrowserProvider(
        //@ts-ignore
        window.ethereum,
        84532
      );

      const signer = await browserProvider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const address = await signer.getAddress();
      const balance = await browserProvider.getBalance(address);

      console.log(`💰 User balance: ${ethers.formatEther(balance)} ETH`);

      const estimatedGas =
        await contract.requestTwitterVerification.estimateGas(
          code,
          verifier,
          true
        );
      console.log(`⛽ Estimated gas: ${estimatedGas.toString()}`);

      const gasPrice = await browserProvider.getFeeData();
      const totalGasCost = BigInt(estimatedGas) * gasPrice.gasPrice!;
      console.log(`💰 Gas cost: ${ethers.formatEther(totalGasCost)} ETH`);

      let transactionPromise;
      if (balance > totalGasCost * 2n) {
        console.log("🔹 Sending contract transaction...");
        const tx = await contract.requestTwitterVerification(
          code,
          verifier,
          true
        );
        transactionPromise = tx.wait();
      } else {
        console.log("🔹 Using API relay...");
        try {
          const signature = await signer.signMessage(
            "gmcoin.meme twitter-verification"
          );
          const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              signature,
              authCode: code,
              verifier,
              autoFollow: true,
            }),
          });

          if (!response.ok) {
            throw new Error(
              `API Error: ${response.status} ${response.statusText}`
            );
          }

          transactionPromise = response.json();
        } catch (apiError: any) {
          console.error("❌ API Error:", apiError);
          throw new Error(`Relayer service error: ${apiError.message}`);
        }
      }

      // Event listening
      const eventPromise = new Promise((resolve, reject) => {
        const infuraProvider = new ethers.WebSocketProvider(
          "wss://base-sepolia.infura.io/ws/v3/46c83ef6f9834cc49b76640eededc9f5"
        );

        const infuraContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          infuraProvider
        );

        const cleanup = () => {
          infuraContract.removeAllListeners("TwitterConnected");
          infuraContract.removeAllListeners("TwitterConnectError");
        };

        const timeout = setTimeout(() => {
          cleanup();
          reject(
            new Error("Transaction timeout: no event received after 60 seconds")
          );
        }, 60000);

        infuraContract.on("TwitterConnected", (userID, wallet, event) => {
          console.log("✅ Twitter connected event received!");
          clearTimeout(timeout);
          cleanup();
          resolve("success");
        });

        infuraContract.on("TwitterConnectError", (wallet, errorMsg, event) => {
          console.error(`❌ Twitter connect error: ${errorMsg}`);
          clearTimeout(timeout);
          cleanup();
          reject(new Error(errorMsg));
        });
      });

      try {
        await Promise.all([transactionPromise, eventPromise]);
        setTransactionStatus("success");
        sessionStorage.removeItem("code");
        sessionStorage.removeItem("verifier");
      } catch (eventError: any) {
        throw new Error(`Transaction event error: ${eventError.message}`);
      }
    } catch (error: any) {
      console.error("❌ Transaction Error:", error);

      if (error?.code === 4001) {
        setErrorMessage("Transaction cancelled by user.");
      } else if (error?.message.includes("insufficient funds")) {
        setErrorMessage("Insufficient balance to process transaction.");
      } else if (error?.message.includes("Relayer service error")) {
        setErrorMessage("Relayer service error. Try again later.");
      } else if (error?.message.includes("timeout")) {
        setErrorMessage("Transaction timed out. Please try again.");
      } else {
        setErrorMessage(`Transaction failed: ${error.message}`);
      }

      setTransactionStatus("error");
      throw error;
    }
  };

  // useEffect(() => {
  //   if (connectedWallet && !isTransactionSent) {
  //     console.log("Wallet connected, attempting transaction...");
  //     sendTransaction();
  //   }
  // }, [connectedWallet]);
  useEffect(() => {
    const handleTwitterCallback = () => {
      const params = new URLSearchParams(window.location.search);
      const authorizationCode = params.get("code");

      if (authorizationCode) {
        setIsTwitterConnected(true);
        sessionStorage.setItem("code", authorizationCode);

        // Clean URL parameters
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };

    handleTwitterCallback();
  }, []);
  const handleStepChange = (newStep: number) => {
    setPreviousStep(currentStep);
    setCurrentStep(newStep);
  };
  const handleBack = async () => {
    if (currentStep === 3) {
      await disconnect();
      setCurrentStep(1); // изменено с 2 на 1, чтобы вернуться к экрану подключения кошелька
      setIsTransactionSent(false);
      updateWalletInfo(""); // Clear wallet info in context
    } else if (currentStep === 2) {
      await disconnect();
      setCurrentStep(1); // изменено с 2 на 1, чтобы вернуться к экрану подключения кошелька
      setIsTransactionSent(false);
      updateWalletInfo(""); // Clear wallet info in contex
    } else if (currentStep === 1) {
      setIsTwitterConnected(false);
      sessionStorage.removeItem("code");
      sessionStorage.removeItem("verifier");
      setCurrentStep(0);
    }
  };
  useEffect(() => {
    if (isTwitterConnected && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [isTwitterConnected]);

  // Update step when wallet is connected
  useEffect(() => {
    if (connectedWallet && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [connectedWallet]);
  return (
    <main className="min-h-screen bg-white">
      <ProgressNavigation
        currentStep={currentStep}
        onBack={handleBack}
        onStepChange={handleStepChange}
      />
      {isAuthorized ? (
        <div className="p-4">Authorized!</div>
      ) : (
        <div>
          {isTwitterLoading ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className={styles.loaderContainer}>
                <SunLoader />
              </div>
            </div>
          ) : (
            <>
              {!isTwitterConnected && (
                <TwitterConnect
                  onConnectClick={openTwitterAuthPopup}
                  isConnecting={false}
                />
              )}

              {/* Остальной JSX остается без изменений */}
              {isTwitterConnected && !connectedWallet && (
                <ConnectWallet
                  onConnect={connect}
                  createAmbireWallet={createAmbireWallet}
                />
              )}
              {isTwitterConnected && connectedWallet && !isTransactionSent && (
                <SendContract
                  connectedWallet={connectedWallet}
                  walletAddress={connectedWallet.accounts[0]?.address || ""}
                  sendTransaction={sendTransaction}
                  connect={connect}
                />
              )}

              {isTransactionSent && (
                <div>
                  {!isEventReceived && (
                    <p className={styles.info}>
                      Transaction sent! Waiting for result..
                    </p>
                  )}
                  {isEventReceived && !transactionError && (
                    <p className={styles.success}>
                      You successfully connected Twitter! 🥳
                    </p>
                  )}
                  {isEventReceived && transactionError && (
                    <p className={styles.error}>
                      Error during twitter verification: {transactionError}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
