# Aave V3 Event Listener Backend

A real-time Ethereum event listener and processor for Aave V3 protocol events. This backend service captures key DeFi protocol events, processes them through a queue system, and stores them on-chain using the Arkiv Network.

## Overview

This service monitors an Aave V3 smart contract for critical events and processes them asynchronously using a robust queue-based architecture. It captures four main event types:

- **Withdraw**: User withdrawals from the protocol
- **Supply**: User deposits and supplies to the protocol
- **FlashLoan**: Flash loan operations
- **LiquidationCall**: Liquidation events

## Architecture

The system consists of two main components:

1. **Event Listener** (`src/index.ts`): Monitors blockchain events in real-time using ethers.js and enqueues them for processing
2. **Worker Service** (`src/worker/index.ts`): Processes queued events and stores them on-chain via Arkiv Network

```
Ethereum Node (RPC)
    ↓
Event Listener → Redis Queue → Worker → Arkiv Network (On-chain Storage)
```

## Technologies

- **ethers.js v6**: Ethereum blockchain interaction
- **BullMQ**: Robust job queue system with retries
- **Redis**: Queue storage and message broker
- **Arkiv Network SDK**: Decentralized on-chain data storage
- **TypeScript**: Type-safe development
- **Zod**: Runtime schema validation
- **Docker**: Redis containerization

## Prerequisites

- Node.js 18+ (or Bun)
- Docker (for Redis)
- An Ethereum RPC endpoint
- Arkiv Network private key

## Installation

```bash
# Install dependencies
npm install
# or
bun install
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:

```env
# Ethereum Configuration
RPC_URL=                    # Your Ethereum RPC endpoint
CONTRACT_ADDRESS=           # Aave V3 Pool contract address

# Arkiv Network Configuration
ARKIV_PRIVATE_KEY=          # Your Arkiv Network private key (for signing transactions)
ARKIV_RPC_URL=https://mendoza.hoodi.arkiv.network/rpc
ARKIV_CHAIN=infurademo      # Available: kaolin, localhost, mendoza, infurademo
WS_URL=wss://mendoza.hoodi.arkiv.network/rpc/ws

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=             # Optional
```

### Contract Addresses

For Aave V3, you'll need the Pool contract address. Here are some examples:

- **Ethereum Mainnet**: `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`
- **Polygon**: `0x794a61358D6845594F94dc1DB02A252b5b4814aD`
- **Arbitrum**: `0x794a61358D6845594F94dc1DB02A252b5b4814aD`

## Running the Project

### Full Stack (Recommended)

Start Redis, the event listener, and worker concurrently:

```bash
npm start
```

This command will:
1. Stop any existing Redis container
2. Start a fresh Redis container
3. Launch both the listener and worker services

### Individual Services

**Start Redis only:**
```bash
npm run start:redis
```

**Start Event Listener only:**
```bash
npm run start:listeners
```

**Start Worker only:**
```bash
npm run start:worker
```

**Stop Redis:**
```bash
npm run stop:redis
```

### Development Mode

Run both services without managing Redis:
```bash
npm run dev:services
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts           # Event listener service
│   ├── worker/
│   │   └── index.ts       # Queue worker service
│   ├── arkiv.ts           # Arkiv Network storage functions
│   └── types.ts           # TypeScript types and Zod schemas
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## How It Works

### 1. Event Listening

The listener service connects to an Ethereum node and monitors the Aave V3 Pool contract for events:

```typescript
contract.on("Withdraw", async (reserve, user, to, amount, event) => {
  // Extract event data
  // Add to queue for processing
});
```

### 2. Queue Processing

Events are added to a BullMQ queue with retry logic:

```typescript
await queue.add(event, data, {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1000 }
});
```

### 3. Data Storage

The worker processes jobs and stores them on Arkiv Network with searchable attributes:

```typescript
await arkivWalletClient.mutateEntities({
  creates: [{
    payload: jsonToPayload(data),
    contentType: "application/json",
    attributes: [
      { key: "protocol", value: "aave-v3" },
      { key: "eventType", value: "Withdraw" },
      // ... additional attributes
    ],
    expiresIn: ExpirationTime.fromHours(24)
  }]
});
```

## Monitored Events

### Withdraw Event
```solidity
event Withdraw(
  address indexed reserve,
  address indexed user,
  address indexed to,
  uint256 amount
)
```

### Supply Event
```solidity
event Supply(
  address indexed reserve,
  address user,
  address indexed onBehalfOf,
  uint256 amount,
  uint16 indexed referralCode
)
```

### FlashLoan Event
```solidity
event FlashLoan(
  address indexed target,
  address initiator,
  address indexed asset,
  uint256 amount,
  uint8 interestRateMode,
  uint256 premium,
  uint16 indexed referralCode
)
```

### LiquidationCall Event
```solidity
event LiquidationCall(
  address indexed collateralAsset,
  address indexed debtAsset,
  address indexed user,
  uint256 debtToCover,
  uint256 liquidatedCollateralAmount,
  address liquidator,
  bool receiveAToken
)
```

## Error Handling

- **Automatic Retries**: Jobs automatically retry up to 5 times with exponential backoff
- **Worker Concurrency**: Set to 1 to ensure sequential processing
- **Event Logging**: Comprehensive console logging for monitoring and debugging

## Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Development

The project uses:
- **Biome**: For code formatting and linting
- **ts-node**: For running TypeScript directly
- **ESM**: ES Module syntax throughout

## Troubleshooting

**Redis connection errors:**
```bash
# Check if Redis is running
docker ps | grep redis

# View Redis logs
docker logs redis
```

**Event listener not receiving events:**
- Verify your RPC_URL is correct and accessible
- Check CONTRACT_ADDRESS matches your target Aave V3 deployment
- Ensure the contract is active on the blockchain

**Worker not processing jobs:**
- Verify Redis connection settings
- Check ARKIV_PRIVATE_KEY is valid
- Review worker logs for specific errors

## License

MIT

## Contributing

This project was built during the ETH Argentina Hackathon / Devconnect 2025.
