# Backend Alignment - Event Type Format Update

## Summary
Updated frontend to match backend's **PascalCase** event type format.

## Backend Event Type Format (Source of Truth)

**Event Type Attribute:** `"event-type"`  
**Values:** PascalCase format
- `"Withdraw"`
- `"Supply"`
- `"FlashLoan"`
- `"LiquidationCall"`

## Files Updated

### 1. `src/lib/types.ts`
- Updated `EventFilters.eventType` to use PascalCase: `"Withdraw" | "Supply" | "FlashLoan" | "LiquidationCall" | "all"`

### 2. `src/lib/queries.ts`
- Updated `queryEventsByType()` to query with PascalCase values
- Updated all query functions: `queryWithdrawEvents()`, `querySupplyEvents()`, `queryFlashLoanEvents()`, `queryLiquidationEvents()`
- Fixed TypeScript errors: undefined checks, BigInt multiplication, toLowerCase on possibly false values

### 3. `src/lib/utils.ts`
- Updated `formatEventType()` to handle PascalCase → "Display Format"
  - `"FlashLoan"` → `"Flash Loan"`
  - `"LiquidationCall"` → `"Liquidation Call"`

### 4. `app/analytics/page.tsx`
- Imported and used `formatEventType()` for chart labels
- Updated info card to show correct backend event types

## Backend Attribute Structure

```typescript
// Example: Withdraw Event
{
  payload: jsonToPayload(data),
  contentType: "application/json",
  attributes: [
    { key: "protocol", value: "aave-v3" },
    { key: "event-type", value: "Withdraw" },  // ← PascalCase
    { key: "reserve", value: data.reserve },
    { key: "user", value: data.user },
    { key: "to", value: data.to },
    { key: "amount", value: data.amount },
    { key: "txHash", value: data.txHash },
  ],
  expiresIn: ExpirationTime.fromHours(24),
}
```

## Query Examples

### Query All Withdraw Events
```typescript
await client
  .buildQuery()
  .where(eq("event-type", "Withdraw"))  // PascalCase
  .fetch();
```

### Query All Aave V3 Events
```typescript
await client
  .buildQuery()
  .where(eq("protocol", "aave-v3"))
  .fetch();
```

## Testing

To verify the changes work:

1. **Start Backend** (generates events with PascalCase):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Check Dashboard** at http://localhost:3001/analytics
   - Events should display with proper formatting
   - Event type chart should show "Withdraw", "Supply", "Flash Loan", "Liquidation Call"

## TypeScript Status

✅ **Main migration code is error-free:**
- `src/lib/types.ts`
- `src/lib/queries.ts`
- `src/lib/utils.ts`
- `app/analytics/page.tsx`
- `src/components/EventDistributionChart.tsx`

⚠️ **Legacy files with errors (not used in main dashboard):**
- `src/app/query/page.tsx` - Old query builder
- `src/components/HourlyVolumeChart.tsx` - Uses old types
- `src/components/PriceHistoryChart.tsx` - Uses old types

## Next Steps

1. Run backend event generator to populate data
2. Test frontend dashboard displays events correctly
3. Verify event type filtering works with PascalCase values
4. (Optional) Update or remove legacy query builder pages
