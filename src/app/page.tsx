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

export default function Home() {
  // const [isAuthorized, setIsAuthorized] = useState(false);
  const isAuthorized = false;
  const [isTwitterConnected, setIsTwitterConnected] = useState(false);
  const [isTwitterLoading, setIsTwitterLoading] = useState(true);
  const [isTransactionSent, setIsTransactionSent] = useState(false);
  const [isEventReceived, setIsEventReceived] = useState(false);
  const [transactionError, setTransactionError] = useState("");
  const { connectedWallet, connect, createAmbireWallet } = useWeb3();

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
    console.log("sendTransaction called");
    if (!connectedWallet) {
      console.error("No connected wallet found.");
      return; // Возвращаем void
    }

    const code = sessionStorage.getItem("code");
    const verifier = sessionStorage.getItem("verifier");

    if (!code || !verifier) {
      console.error("Missing code or verifier in session storage.");
      return; // Возвращаем void
    }

    try {
      const browserProvider = new ethers.BrowserProvider(
        //@ts-ignore
        window.ethereum,
        84532
      );
      const signer = await browserProvider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const address = await signer.getAddress();
      const balance = await browserProvider.getBalance(address);
      const balanceEther = ethers.formatEther(balance);

      console.log("balance", balance, balanceEther);
      const estimatedGas =
        await contract.requestTwitterVerification.estimateGas(
          code,
          verifier,
          true
        );
      console.log("estimatedGas", estimatedGas);
      const gasPrice = await browserProvider.getFeeData();
      const totalGasCost = BigInt(estimatedGas) * gasPrice.gasPrice!;
      const ethCost = ethers.formatEther(totalGasCost);
      console.log(`💰 Estimated Cost in ETH: ${ethCost}`);
      //@ts-ignore
      if (balance > totalGasCost * 2n) {
        const tx = await contract.requestTwitterVerification(
          code,
          verifier,
          true
        );
        await tx.wait();
        setIsTransactionSent(true);
      } else {
        const signature = await signer.signMessage(
          "gmcoin.meme twitter-verification"
        );
        try {
          const response = await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              signature,
              authCode: code,
              verifier,
              autoFollow: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const responseData = await response.json();
          console.log(`✅ Success: ${JSON.stringify(responseData)}`);
        } catch (error) {
          //@ts-ignore
          transactionError.value = `Error sending transaction through Relayer: ${error}`;
          console.error("❌ Error sending request:", error);
        }
        setIsTransactionSent(true);
      }

      const infuraProvider = new ethers.WebSocketProvider(
        "wss://base-sepolia.infura.io/ws/v3/46c83ef6f9834cc49b76640eededc9f5"
      );
      const infuraContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        infuraProvider
      );

      const handleEvents = () => {
        return new Promise<void>((resolve) => {
          infuraContract.on("TwitterConnected", (userID, wallet, event) => {
            setIsEventReceived(true);
            sessionStorage.removeItem("code");
            sessionStorage.removeItem("verifier");
            event.removeListener();
            resolve();
          });

          infuraContract.on(
            "TwitterConnectError",
            (wallet, errorMsg, event) => {
              setIsEventReceived(true);
              setTransactionError(errorMsg);
              sessionStorage.removeItem("code");
              sessionStorage.removeItem("verifier");
              event.removeListener();
              resolve();
            }
          );
        });
      };

      await handleEvents();
    } catch (error) {
      setTransactionError(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

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

  return (
    <main className="min-h-screen bg-white">
      {isAuthorized ? (
        <div className="p-4">Authorized!</div>
      ) : (
        <div>
          {isTwitterLoading ? (
            <div className="flex items-center justify-center min-h-screen">
              <SunLoader />
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
                // <div>
                //   <p className={styles.info}>
                //     Connected wallet: {connectedWallet.accounts[0].address}
                //   </p>
                //   {connectedChain && (
                //     <p className={styles.info}>
                //       Connected chain: {connectedChain.id}
                //     </p>
                //   )}
                //   <button className={styles.button} onClick={sendTransaction}>
                //     Send transaction
                //   </button>
                // </div>
                <SendContract
                  connectedWallet={connectedWallet}
                  sendTransaction={sendTransaction}
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
