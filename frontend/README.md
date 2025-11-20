# Arkiv Analytics Dashboard

A Dune Analytics-style dashboard built with Next.js 15 that queries and visualizes Aave protocol events stored on Arkiv's DB-chain.

## Features

- **Real-time Analytics**: Live statistics for Aave protocol events
- **Event Querying**: Query blockchain events with filtering capabilities
- **Server-Side Rendering**: Optimized data fetching with Next.js App Router
- **Dark Mode Support**: Beautiful UI with Tailwind CSS
- **Type-Safe**: Full TypeScript implementation
- **Real-time Subscriptions**: Live event updates via Arkiv SDK

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Arkiv SDK (@arkiv-network/sdk)
- **Charts**: Recharts
- **Date Formatting**: date-fns

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm, pnpm, or yarn

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd arkiv-first-contact-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Arkiv network configuration (already configured for Mendoza testnet).

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Build

Build the production application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── events/        # Events query endpoint
│   │   │   └── stats/         # Statistics endpoint
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── StatsCards.tsx     # Statistics cards
│   │   ├── EventsTable.tsx    # Events data table
│   │   └── FilterBar.tsx      # Filter controls
│   ├── lib/                   # Core library code
│   │   ├── arkiv.ts          # Arkiv client setup
│   │   ├── types.ts          # TypeScript types
│   │   ├── queries.ts        # Query functions
│   │   └── subscriptions.ts  # Real-time subscriptions
│   └── utils/                # Utility functions
├── .env.local                # Environment variables
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## Environment Variables

```env
NEXT_PUBLIC_ARKIV_RPC_URL=https://mendoza.hoodi.arkiv.network/rpc
NEXT_PUBLIC_ARKIV_WS_URL=wss://mendoza.hoodi.arkiv.network/rpc/ws
```

## Arkiv Network Information

- **Chain ID**: 60138453056
- **RPC URL**: https://mendoza.hoodi.arkiv.network/rpc
- **WebSocket URL**: wss://mendoza.hoodi.arkiv.network/rpc/ws
- **Explorer**: https://explorer.mendoza.hoodi.arkiv.network/

## Features Breakdown

### 1. Stats Dashboard
Displays real-time statistics:
- Total events
- Unique users
- Event counts by type (Supply, Borrow, Withdraw, Repay, Liquidation)

### 2. Events Table
Shows recent Aave protocol events with:
- Event type badge
- Asset information
- Amount
- User address
- Timestamp
- Transaction hash link

### 3. Query Filtering
Filter events by:
- Event type
- Asset
- User address
- Date range
- Result limit

### 4. Real-time Updates
- Auto-refresh stats every 30 seconds
- Real-time event subscriptions (optional)
- Server-side data revalidation

## API Routes

### GET /api/events
Query blockchain events with filters.

**Query Parameters:**
- `eventType`: Filter by event type (Supply, Borrow, etc.)
- `asset`: Filter by asset (USDC, WETH, etc.)
- `user`: Filter by user address
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `limit`: Number of results (default: 100)

**Example:**
```bash
curl "http://localhost:3000/api/events?eventType=Supply&limit=10"
```

### GET /api/stats
Get aggregated statistics.

**Example:**
```bash
curl "http://localhost:3000/api/stats"
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_ARKIV_RPC_URL`
   - `NEXT_PUBLIC_ARKIV_WS_URL`

### Other Platforms

The application can be deployed to any platform supporting Next.js 15:
- Netlify
- AWS Amplify
- Docker
- Self-hosted

## Performance Optimization

- **ISR (Incremental Static Regeneration)**: Pages revalidate every 30 seconds
- **Server Components**: Data fetching happens on the server
- **Automatic Code Splitting**: Next.js optimizes bundle size
- **Image Optimization**: Built-in Next.js image optimization

## Development Tips

1. **Type Safety**: Always use proper TypeScript types
2. **Error Handling**: Implement try-catch blocks for async operations
3. **Loading States**: Show loading indicators for better UX
4. **Caching**: Utilize Next.js caching strategies
5. **Real-time**: Use subscriptions for live data when needed

## Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Connection Issues
- Verify environment variables are set correctly
- Check Arkiv network status
- Ensure RPC URL is accessible

## Resources

- [Arkiv Documentation](https://arkiv.network/docs)
- [Arkiv SDK on npm](https://www.npmjs.com/package/@arkiv-network/sdk)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues or questions:
- Open a GitHub issue
- Visit Arkiv Discord community
- Check the documentation
