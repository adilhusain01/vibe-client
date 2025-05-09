import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// import { ethers } from 'ethers';
import { networks } from '../utils/networks';

export const WalletContext = createContext();

const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [network, setNetwork] = useState('');

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask -> https://metamask.io/');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const account = accounts[0];
        setWalletAddress(account);
        localStorage.setItem('walletAddress', account);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have MetaMask!');
      return;
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
      setWalletAddress(null);
      localStorage.removeItem('walletAddress');
    } else {
      const account = accounts[0];
      setWalletAddress(account);
      localStorage.setItem('walletAddress', account);

      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const networkName = networks[chainId] || 'Unknown Network';
      setNetwork(networkName);
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x4f5e0c' }], 
        });

        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const networkName = networks[chainId] || 'Unknown Network';
        setNetwork(networkName);
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
        }
        
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x4f5e0c',
                  chainName: 'Electorneum',
                  rpcUrls: ['https://rpc.ankr.com/electroneum_testnet'], 
                  nativeCurrency: {
                    name: 'ETNT',
                    symbol: 'ETNT',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://testnet-blockexplorer.electroneum.com/'],
                },
              ],
            });
          } catch (addError) {
            console.error('Error adding Ethereum chain:', addError);
          }
        } else {
          console.error('Error switching network:', error);
        }
      }
    } else {
      alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();

    window.ethereum?.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
        localStorage.removeItem('walletAddress');
      } else {
        setWalletAddress(accounts[0]);
        localStorage.setItem('walletAddress', accounts[0]);
      }
    });

    window.ethereum?.on('chainChanged', () => {
      window.location.reload();
    });
  }, []);

  return (
    <WalletContext.Provider value={{ walletAddress, connectWallet, switchNetwork, network }}>
      {children}
    </WalletContext.Provider>
  );
};

WalletProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default WalletProvider;
