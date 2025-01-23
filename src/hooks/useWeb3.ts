/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
// import init from '@web3-onboard/core';
import { init, useSetChain } from "@web3-onboard/react";

import injectedModule from '@web3-onboard/injected-wallets';
import metamaskSDK from '@web3-onboard/metamask';
import phantomModule from '@web3-onboard/phantom';
import { AmbireWalletModule } from '@ambire/login-sdk-web3-onboard';
import { AmbireLoginSDK } from '@ambire/login-sdk-core'
import type { WalletState, Chain } from '@/src/types';
import { CHAINS } from '@/src/config';
import { ethers } from 'ethers';

export const useWeb3 = () => {
  const [web3Onboard, setWeb3Onboard] = useState<any>(null);
  const [connectedWallet, setConnectedWallet] = useState<WalletState | null>(null);
  const [connectedChain, setConnectedChain] = useState<Chain | null>(null);
  useEffect(() => {
    if (!web3Onboard) return;
 
    const walletsSub = web3Onboard.state.select('wallets').subscribe((wallets:any) => {
      if (wallets && wallets.length > 0) {
        setConnectedWallet(wallets[0]);
        if (wallets[0].chains && wallets[0].chains.length > 0) {
          setConnectedChain(wallets[0].chains[0]);
        }
      } else {
  
        setConnectedWallet(null);
        setConnectedChain(null);
      }
    });

    return () => {
      walletsSub.unsubscribe();
    };
  }, [web3Onboard]);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ambireWallet = AmbireWalletModule({
      dappName: 'GM',
      dappIconPath: 'https://pbs.twimg.com/profile_images/1834344421984256000/AcWFYzUl_400x400.jpg',
    });

    const metamaskSDKWallet = metamaskSDK({
      options: {
        extensionOnly: false,
        dappMetadata: {
          name: 'GM',
        },
      },
    });

    const phantom = phantomModule();
    const injected = injectedModule();

    const onboard = init({
      wallets: [injected, ambireWallet, metamaskSDKWallet, phantom],
      connect: {
        showSidebar: true,
        autoConnectLastWallet: true,
      },
      chains: CHAINS,
      appMetadata: {
        name: 'GM',
        icon: 'https://pbs.twimg.com/profile_images/1834344421984256000/AcWFYzUl_400x400.jpg',
        description: 'GM ☀️ first tweet&mint coin',
        recommendedInjectedWallets: [
          { name: 'MetaMask', url: 'https://metamask.io' },
          { name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
        ],
        gettingStartedGuide: 'getting started guide',
      },
      accountCenter: {
        desktop: {
          enabled: true,
        },
      },
    });

    setWeb3Onboard(onboard);
  }, []);
  const getProvider = () => {
    if (!connectedWallet?.provider) {
      throw new Error('No wallet connected');
    }
    return new ethers.BrowserProvider(connectedWallet.provider);
  };

  const getSigner = async () => {
    const provider = getProvider();
    return await provider.getSigner();
  };
  const connect = async () => {
    if (!web3Onboard) return;

    try {
      const wallets = await web3Onboard.connectWallet();
      await web3Onboard.connectWallet();
      if (wallets[0]) {
        setConnectedWallet(wallets[0]);
        await web3Onboard.connectWallet();
        if (wallets[0].chains && wallets[0].chains.length > 0) {
          setConnectedChain(wallets[0].chains[0]);
        }

        web3Onboard.state.select('chains').subscribe((chains: Chain[]) => {
          if (chains && chains.length > 0) {
            setConnectedChain(chains[0]);
          }
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };
  const createAmbireWallet = async () => {
    try {
      const ambireLoginSDK = new AmbireLoginSDK({
        dappName: "GM",
        dappIconPath: 'https://pbs.twimg.com/profile_images/1834344421984256000/AcWFYzUl_400x400.jpg',
      });

      ambireLoginSDK.openLogin();
      console.log("Ambire Wallet created successfully!");
    } catch (error) {
      console.error("Error creating Ambire Wallet:", error);
    }
  };
  const disconnect = async () => {
    if (!web3Onboard || !connectedWallet) return;
  
    try {
      await web3Onboard.disconnectWallet({ label: connectedWallet.label });
      setConnectedWallet(null);
      setConnectedChain(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };
  return {
    disconnect,
    web3Onboard,
    connectedWallet,
    connectedChain,
    connect,
    createAmbireWallet,
    getProvider,
    getSigner
  };
};