import React from 'react';
import { type Ticker } from '@/services/types/user';

interface TickerListProps {
  tickers: Ticker[];
  selectedSymbol: string | null;
  onSelectTicker: (symbol: string) => void;
}

export const TickerList: React.FC<TickerListProps> = ({
  tickers,
  selectedSymbol,
  onSelectTicker,
}) => {
  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatChange = (change: number, changePercent: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatPrice(change)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  return (
    <div className='ticker-list'>
      <h2>Market Tickers</h2>
      <div className='ticker-items'>
        {tickers.map(ticker => {
          const isPositive = ticker.change >= 0;
          const isSelected = ticker.symbol === selectedSymbol;

          return (
            <div
              key={ticker.symbol}
              className={`ticker-item ${isSelected ? 'selected' : ''} ${
                isPositive ? 'positive' : 'negative'
              }`}
              onClick={() => onSelectTicker(ticker.symbol)}
            >
              <div className='ticker-header'>
                <span className='ticker-symbol'>{ticker.symbol}</span>
                <span className='ticker-price'>${formatPrice(ticker.price)}</span>
              </div>
              <div className='ticker-details'>
                <span className='ticker-name'>{ticker.name}</span>
                <span className={`ticker-change ${isPositive ? 'positive' : 'negative'}`}>
                  {formatChange(ticker.change, ticker.changePercent)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
