export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  price_per_share: number;
  quantity: number;
  timestamp: string;
}
