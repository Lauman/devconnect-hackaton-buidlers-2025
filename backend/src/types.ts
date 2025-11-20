import { MutateEntitiesReturnType } from "@arkiv-network/sdk";
import * as z from "zod";

export const withdrawSchema = z.object({
	protocol: z.string(),
	eventType: z.string(),
	reserve: z.string(),
	user: z.string(),
	to: z.string(),
	amount: z.string().transform((val) => BigInt(val)),
	txHash: z.string()
});

export const supplySchema = z.object({
	protocol: z.string(),
	eventType: z.string(),
	reserve: z.string(),
	user: z.string(),
	onBehalfOf: z.string(),
	amount: z.string().transform((val) => BigInt(val)),
	referralCode: z.string().transform((val) => BigInt(val)),
	txHash: z.string()
});

export const flashLoanSchema = z.object({
	protocol: z.string(),
	eventType: z.string(),
	target: z.string(),
	initiator: z.string(),
	asset: z.string(),
	amount: z.string().transform((val) => BigInt(val)),
	interestRateMode: z.string().transform((val) => BigInt(val)),
	premium: z.string().transform((val) => BigInt(val)),
	referralCode: z.string().transform((val) => BigInt(val)),
	txHash: z.string()
});

export const liquidationCallSchema = z.object({
	protocol: z.string(),
	eventType: z.string(),
	collateralAsset: z.string(),
	debtAsset: z.string(),
	user: z.string(),
	debtToCover: z.string().transform((val) => BigInt(val)),
	liquidatedCollateralAmount: z.string().transform((val) => BigInt(val)),
	liquidator: z.string(),
	receiveAToken: z.boolean(),
	txHash: z.string()
});

export type WithdrawSchema = z.input<typeof withdrawSchema>;
export type SupplySchema = z.input<typeof supplySchema>;
export type FlashLoanSchema = z.input<typeof flashLoanSchema>;
export type LiquidationCallSchema = z.input<typeof liquidationCallSchema>;


export type DataType = "stats" | "blockdata" | "blocknumber";

export type AccionHandler = (arg1: any) => Promise<MutateEntitiesReturnType>;

export type AccionKeys = "withdraw" | "supply" | "flashLoan" | "liquidationCall";
export type FunctionRegistry = {
	[key in AccionKeys]: AccionHandler;
};