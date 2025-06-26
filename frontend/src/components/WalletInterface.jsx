import React, { useState, useEffect } from 'react';
import NetworkList from './NetworkList';
import WalletList from './WalletList';
import WalletDetails from './WalletDetails';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Wallet } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  mockNetworks, 
  getWalletsForNetwork, 
  getTransactionsForWallet,
  mockWalletFunctions 
} from '../data/mockWallets';

const WalletInterface = ({ user, onBackToMenu }) => {
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [networks, setNetworks] = useState(mockNetworks);
  const [walletsData, setWalletsData] = useState({});
  const [transactionsData, setTransactionsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [walletsCount, setWalletsCount] = useState({});
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // Don't auto-select any network, let user choose
    // Load wallets count for each network
    loadWalletsCount();
  }, []);

  useEffect(() => {
    if (selectedNetwork) {
      loadWalletsForNetwork(selectedNetwork.id);
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (selectedWallet) {
      loadTransactionsForWallet(selectedWallet.id);
    }
  }, [selectedWallet]);

  const loadWalletsCount = () => {
    const counts = {};
    networks.forEach(network => {
      const wallets = getWalletsForNetwork(network.id);
      counts[network.id] = wallets.length;
    });
    setWalletsCount(counts);
  };

  const loadWalletsForNetwork = (networkId) => {
    setIsLoading(true);
    try {
      const wallets = getWalletsForNetwork(networkId);
      setWalletsData(prev => ({
        ...prev,
        [networkId]: wallets
      }));
    } catch (error) {
      console.error('Error loading wallets:', error);
      toast({
        title: "Failed to load wallets",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactionsForWallet = (walletId) => {
    try {
      const transactions = getTransactionsForWallet(walletId);
      setTransactionsData(prev => ({
        ...prev,
        [walletId]: transactions
      }));
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleSelectNetwork = (network) => {
    setSelectedNetwork(network);
    setSelectedWallet(null); // Clear selected wallet when changing network
  };

  const handleSelectWallet = (wallet) => {
    setSelectedWallet(wallet);
    // Show modal only on mobile
    if (window.innerWidth < 1024) {
      setShowWalletModal(true);
    }
  };

  const handleCreateWallet = async (networkId, walletName) => {
    setIsLoading(true);
    try {
      const newWallet = await mockWalletFunctions.createWallet(networkId, walletName);
      
      // Add new wallet to the data
      setWalletsData(prev => ({
        ...prev,
        [networkId]: [...(prev[networkId] || []), newWallet]
      }));
      
      // Update wallets count
      setWalletsCount(prev => ({
        ...prev,
        [networkId]: (prev[networkId] || 0) + 1
      }));
      
      toast({
        title: "Wallet Created",
        description: `${walletName} has been successfully created!`,
      });
      
      // Auto-select the new wallet
      setSelectedWallet(newWallet);
      setShowWalletModal(true); // Show modal on mobile
      
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast({
        title: "Failed to create wallet",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTransaction = async (fromWallet, toAddress, amount, currency) => {
    try {
      const result = await mockWalletFunctions.sendTransaction(fromWallet, toAddress, amount, currency);
      
      // Add transaction to the data
      const newTransaction = {
        id: `tx-${Date.now()}`,
        type: 'sent',
        amount,
        currency,
        from: fromWallet.address,
        to: toAddress,
        hash: result.txHash,
        timestamp: new Date(),
        status: result.status,
        fee: '0.001',
        gasUsed: '21000'
      };
      
      setTransactionsData(prev => ({
        ...prev,
        [fromWallet.id]: [newTransaction, ...(prev[fromWallet.id] || [])]
      }));
      
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  const handleRefreshBalance = async (walletId) => {
    try {
      const updatedBalance = await mockWalletFunctions.getWalletBalance(walletId);
      
      // Update wallet balance in the data
      if (selectedNetwork) {
        setWalletsData(prev => ({
          ...prev,
          [selectedNetwork.id]: prev[selectedNetwork.id]?.map(wallet =>
            wallet.id === walletId 
              ? { ...wallet, ...updatedBalance }
              : wallet
          ) || []
        }));
        
        // Update selected wallet if it's the one being refreshed
        if (selectedWallet?.id === walletId) {
          setSelectedWallet(prev => ({ ...prev, ...updatedBalance }));
        }
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
      throw error;
    }
  };

  const getCurrentWallets = () => {
    return selectedNetwork ? (walletsData[selectedNetwork.id] || []) : [];
  };

  const getCurrentTransactions = () => {
    return selectedWallet ? (transactionsData[selectedWallet.id] || []) : [];
  };

  const handleBackToNetworks = () => {
    setSelectedNetwork(null);
    setSelectedWallet(null);
    setShowWalletModal(false);
  };

  const handleBackToWallets = () => {
    setSelectedWallet(null);
    setShowWalletModal(false);
  };

  const handleCloseModal = () => {
    setShowWalletModal(false);
    setSelectedWallet(null);
  };

  return (
    <>
      <div className="h-screen bg-slate-900 flex overflow-hidden">
        {/* Desktop Layout */}
        <div className="hidden lg:flex w-full">
          {/* Network List */}
          <div className="h-full w-80">
            <NetworkList 
              networks={networks}
              selectedNetwork={selectedNetwork}
              onSelectNetwork={handleSelectNetwork}
              isLoading={isLoading}
              walletsCount={walletsCount}
            />
          </div>
          {!selectedNetwork ? (
            {/* When no network selected - show single placeholder */}
            <div className="flex-1 h-full flex items-center justify-center bg-slate-800/50">
              <div className="text-center text-gray-400">
                <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Choose a blockchain network</h3>
                <p className="text-sm">Select a network from the list to view and manage your wallets</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex">
              {/* Wallet List */}
              <div className="h-full w-96">
                <WalletList 
                  network={selectedNetwork}
                  wallets={getCurrentWallets()}
                  selectedWallet={selectedWallet}
                  onSelectWallet={handleSelectWallet}
                  onCreateWallet={handleCreateWallet}
                  onBack={handleBackToNetworks}
                  isLoading={isLoading}
                />
              </div>
              
              {/* Wallet Details - Full width for better experience */}
              <div className="flex-1">
                {selectedWallet ? (
                  <WalletDetails 
                    wallet={selectedWallet}
                    network={selectedNetwork}
                    transactions={getCurrentTransactions()}
                    onBack={handleBackToWallets}
                    onSendTransaction={handleSendTransaction}
                    onRefreshBalance={handleRefreshBalance}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-800/50">
                    <div className="text-center text-gray-400">
                      <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">Select a wallet to manage</h3>
                      <p className="text-sm">Choose a wallet from the list to start managing your crypto assets</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden w-full">
          {!selectedNetwork ? (
            /* Networks - Full Screen on Mobile */
            <NetworkList 
              networks={networks}
              selectedNetwork={selectedNetwork}
              onSelectNetwork={handleSelectNetwork}
              isLoading={isLoading}
              walletsCount={walletsCount}
              onBackToMenu={onBackToMenu}
              showBackButton={true}
            />
          ) : (
            /* Wallets - Full Screen on Mobile */
            <WalletList 
              network={selectedNetwork}
              wallets={getCurrentWallets()}
              selectedWallet={selectedWallet}
              onSelectWallet={handleSelectWallet}
              onCreateWallet={handleCreateWallet}
              onBack={handleBackToNetworks}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Mobile Modal for Wallet Details */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="max-w-[95vw] h-[90vh] p-0 bg-slate-800 border-slate-700 lg:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Wallet Details</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-hidden">
            {selectedWallet && (
              <WalletDetails 
                wallet={selectedWallet}
                network={selectedNetwork}
                transactions={getCurrentTransactions()}
                onBack={handleCloseModal}
                onSendTransaction={handleSendTransaction}
                onRefreshBalance={handleRefreshBalance}
                isMobile={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletInterface;