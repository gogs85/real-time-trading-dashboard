import React from 'react';
import { useNavigate } from 'react-router-dom';
import { type Ticker } from '@/services/types/user';

interface TickerListProps {
  tickers: Ticker[];
  selectedSymbol: string | null;
  onSelectTicker?: (symbol: string) => void;
  linkToDetail?: boolean;
}

export const TickerList: React.FC<TickerListProps> = ({
  tickers,
  selectedSymbol,
  onSelectTicker,
  linkToDetail = false,
}) => {
  const navigate = useNavigate();

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

  const handleTickerClick = (symbol: string) => {
    if (linkToDetail) {
      navigate(`/ticker/${symbol}`);
    } else if (onSelectTicker) {
      onSelectTicker(symbol);
    }
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
              onClick={() => handleTickerClick(ticker.symbol)}
              style={{ cursor: 'pointer' }}
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
