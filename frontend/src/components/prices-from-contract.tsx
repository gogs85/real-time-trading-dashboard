import { useState, useEffect } from 'react';

export type PriceFromContractProps = {
  pairName: string;
  contractAddress: string;
  decimals?: number;
};

export function PriceFromContract({ pairName, contractAddress }: PriceFromContractProps) {
  const [price] = useState<string>('...');
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [isRefetching] = useState(false);

  // TODO: Implement price fetching from contract
  // const fetchPrice = useCallback(async () => {
  //   try {
  //     setIsRefetching(true);
  //     setError(null);
  //     const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
  //     const contract = new ethers.Contract(contractAddress, chainlinkAbi, provider);
  //     const latestRoundData = await contract.latestRoundData();
  //     const priceBigInt = latestRoundData[1];
  //     const priceNumber = Number(priceBigInt) / 10 ** decimals;
  //     const formattedPrice = `$${priceNumber.toFixed(decimals === 8 ? 2 : 4)}`;
  //     setPrice(formattedPrice);
  //     setIsLoading(false);
  //   } catch (err) {
  //     console.error(`Error fetching ${pairName}:`, err);
  //     setError(err instanceof Error ? err.message : 'Unknown error');
  //     setIsLoading(false);
  //   } finally {
  //     setIsRefetching(false);
  //   }
  // }, [contractAddress, pairName, decimals]);

  useEffect(() => {
    // Simulate loading for demo purposes
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [contractAddress]);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Fetching {pairName} price...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6 shadow-sm">
        <div className="text-sm text-destructive">
          Error fetching {pairName}: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{pairName}</h3>
          {isRefetching && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          )}
        </div>
        <p className="text-3xl font-bold">{price}</p>
        <p className="text-xs text-muted-foreground">
          Contract: {contractAddress.substring(0, 6)}...{contractAddress.substring(38)}
        </p>
      </div>
    </div>
  );
}
