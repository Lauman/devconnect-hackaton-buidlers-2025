import * as z from "zod";

export const withdrawSchema = z.object({
	reserve: z.string(),
	user: z.string(),
	to: z.string(),
	amount: z.string().transform((val) => BigInt(val)),
    txHash: z.string()
});

export const supplySchema = z.object({
	reserve: z.string(),
	user: z.string(),
	onBehalfOf: z.string(),
	amount: z.string().transform((val) => BigInt(val)),
	referralCode: z.string().transform((val) => BigInt(val)),
}); 

export const flashLoanSchema = z.object({
	target: z.string(),
	initiator: z.string(),
	asset: z.string(),
	amount: z.string().transform((val) => BigInt(val)),
	interestRateMode: z.string().transform((val) => BigInt(val)),
	premium: z.string().transform((val) => BigInt(val)),
	referralCode: z.string().transform((val) => BigInt(val)),
});

export type WithdrawSchema = z.infer<typeof withdrawSchema>;
export type SupplySchema = z.infer<typeof supplySchema>;
export type FlashLoanSchema = z.infer<typeof flashLoanSchema>;


export type DataType = "stats" | "blockdata" | "blocknumber";

