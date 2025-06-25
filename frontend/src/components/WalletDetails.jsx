import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft,
  Send, 
  Download, 
  Copy, 
  History, 
  QrCode,
  Eye,
  EyeOff,
  ExternalLink,
  Star,
  Settings,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';

const WalletDetails = ({ 
  wallet, 
  network, 
  transactions = [],
  onBack, 
  onSendTransaction,
  onRefreshBalance,
  isMobile = false
}) => {
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  if (!wallet || !network) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-800/50">
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💰</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Select a wallet</h3>
          <p className="text-sm">Choose a wallet to view details and manage funds</p>
        </div>
      </div>
    );
  }

  const handleSendTransaction = async (e) => {
    e.preventDefault();
    if (!sendAmount || !sendAddress) return;

    setIsSending(true);
    try {
      const result = await onSendTransaction(wallet, sendAddress, sendAmount, network.symbol);
      toast({
        title: "Transaction Sent",
        description: `Sent ${sendAmount} ${network.symbol} to ${formatAddress(sendAddress)}`,
      });
      setSendAmount('');
      setSendAddress('');
    } catch (error) {
      console.error('Transaction failed:', error);
      toast({
        title: "Transaction Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshBalance(wallet.id);
      toast({
        title: "Balance Updated",
        description: "Wallet balance has been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not update balance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} has been copied to clipboard.`,
    });
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!showBalance) return '••••••';
    return balance;
  };

  const formatUsdValue = (usdValue) => {
    if (!showBalance) return '••••••';
    return `$${usdValue}`;
  };

  const openInExplorer = (hash) => {
    const url = `${network.explorerUrl}/tx/${hash}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex-1 h-full bg-slate-800 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className={`${isMobile ? 'block' : 'lg:hidden'} text-gray-400 hover:text-white`}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${network.color} flex items-center justify-center relative`}>
              <span className="text-white font-bold text-sm">
                {wallet.name.charAt(0).toUpperCase()}
              </span>
              {wallet.isDefault && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 border-2 border-slate-800 rounded-full flex items-center justify-center">
                  <Star className="w-2 h-2 text-slate-800 fill-slate-800" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{wallet.name}</h1>
              <p className="text-sm text-gray-400">{network.name} Wallet</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="text-gray-400 hover:text-white"
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Balance Card */}
        <Card className="bg-slate-700 border-slate-600 mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mb-4">
                <div className="text-4xl font-bold text-white mb-2">
                  {formatBalance(wallet.balance)} {network.symbol}
                </div>
                <div className="text-lg text-gray-400">
                  ≈ {formatUsdValue(wallet.usdValue)}
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center space-x-1">
                  <span>{wallet.transactions} transactions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Active wallet</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-sm">
                <span className="text-gray-400 break-all">
                  {formatAddress(wallet.address)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(wallet.address, 'Wallet address')}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - более компактные на мобильных */}
        <div className={`grid grid-cols-2 gap-4 mb-6 ${isMobile ? 'px-2' : ''}`}>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 h-auto">
            <div className="text-center">
              <Send className="w-6 h-6 mx-auto mb-2" />
              <span>Send</span>
            </div>
          </Button>
          <Button variant="outline" className="border-emerald-500 text-emerald-400 hover:bg-emerald-600 hover:text-white p-4 h-auto">
            <div className="text-center">
              <Download className="w-6 h-6 mx-auto mb-2" />
              <span>Receive</span>
            </div>
          </Button>
        </div>

        {/* Main Interface */}
        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="send" className="data-[state=active]:bg-emerald-600">
              <Send className="w-4 h-4 mr-2" />
              <span className={isMobile ? 'hidden sm:block' : ''}>Send</span>
            </TabsTrigger>
            <TabsTrigger value="receive" className="data-[state=active]:bg-emerald-600">
              <Download className="w-4 h-4 mr-2" />
              <span className={isMobile ? 'hidden sm:block' : ''}>Receive</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600">
              <History className="w-4 h-4 mr-2" />
              <span className={isMobile ? 'hidden sm:block' : ''}>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-4">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Send {network.symbol}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendTransaction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Recipient Address
                    </label>
                    <Input
                      value={sendAddress}
                      onChange={(e) => setSendAddress(e.target.value)}
                      placeholder="Enter wallet address..."
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount ({network.symbol})
                    </label>
                    <Input
                      type="number"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-slate-600 border-slate-500 text-white"
                      step="0.000001"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={isSending || !sendAmount || !sendAddress}
                    >
                      {isSending ? 'Sending...' : 'Send Transaction'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSendAmount(wallet.balance)}
                    >
                      Max
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receive" className="space-y-4">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Receive {network.symbol}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-32 h-32 bg-white rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <p className="text-sm text-gray-400 mb-2">QR Code for {wallet.name}</p>
                </div>
                
                <div className="p-4 bg-slate-600 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 break-all">
                      {wallet.address}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(wallet.address, 'Wallet address')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Only send {network.symbol} and {network.name}-compatible tokens to this address
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                    <p className="text-gray-400">No transactions yet</p>
                    <p className="text-sm text-gray-500 mt-1">Your transaction history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-600 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'sent' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {tx.type === 'sent' ? <Send className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {tx.type === 'sent' ? 'Sent' : 'Received'} {tx.amount} {tx.currency}
                            </p>
                            <p className="text-sm text-gray-400">
                              {tx.type === 'sent' ? `To: ${formatAddress(tx.to)}` : `From: ${formatAddress(tx.from)}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'}>
                              {tx.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openInExplorer(tx.hash)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WalletDetails;