// Arkiv Network Constants
export const ARKIV_NETWORK = {
  chainId: 60138453056,
  rpcUrl: 'https://mendoza.hoodi.arkiv.network/rpc',
  wsUrl: 'wss://mendoza.hoodi.arkiv.network/rpc/ws',
  explorerUrl: 'https://explorer.mendoza.hoodi.arkiv.network',
  faucetUrl: 'https://mendoza.hoodi.arkiv.network/faucet',
} as const;

// Aave Protocol Constants
export const AAVE_ASSETS = [
  'USDC',
  'WETH',
  'DAI',
  'USDT',
  'WBTC',
  'LINK',
] as const;

export const AAVE_EVENT_TYPES = [
  'Supply',
  'Borrow',
  'Withdraw',
  'Repay',
  'LiquidationCall',
] as const;

// Asset metadata
export const ASSET_METADATA: Record<string, { name: string; decimals: number }> = {
  USDC: { name: 'USD Coin', decimals: 6 },
  WETH: { name: 'Wrapped Ether', decimals: 18 },
  DAI: { name: 'Dai Stablecoin', decimals: 18 },
  USDT: { name: 'Tether USD', decimals: 6 },
  WBTC: { name: 'Wrapped Bitcoin', decimals: 8 },
  LINK: { name: 'Chainlink', decimals: 18 },
};

// Event descriptions
export const EVENT_DESCRIPTIONS: Record<string, string> = {
  Supply: 'User deposited assets to earn interest',
  Borrow: 'User borrowed assets using collateral',
  Withdraw: 'User withdrew previously deposited assets',
  Repay: 'User repaid borrowed assets',
  LiquidationCall: 'Undercollateralized position was liquidated',
};
