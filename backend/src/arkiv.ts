import {
  createPublicClient,
  createWalletClient,
  defineChain,
  type Entity,
  http,
} from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { kaolin, localhost, mendoza } from "@arkiv-network/sdk/chains";
import type { Chain } from "viem";
import {
  WithdrawSchema,
  SupplySchema,
  FlashLoanSchema,
  LiquidationCallSchema,
} from "./types.js";
import {
  ExpirationTime,
  jsonToPayload,
  stringToPayload,
} from "@arkiv-network/sdk/utils";
import dotenv from "dotenv";
dotenv.config();
const chains = {
  kaolin: kaolin,
  localhost: localhost,
  mendoza: mendoza,
  infurademo: defineChain({
    id: 60138453045,
    name: "InfuraDemo",
    network: "infurademo",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ["https://infurademo.hoodi.arkiv.network/rpc"],
      },
    },
  }),
} as Record<string, Chain>;
const arkivWalletClient = createWalletClient({
  chain: mendoza,
  transport: http("https://mendoza.hoodi.arkiv.network/rpc"),
  account: privateKeyToAccount(process.env.ARKIV_PRIVATE_KEY as `0x${string}`),
});

const arkivPublicClient = createPublicClient({
  chain: chains[process.env.ARKIV_CHAIN as keyof typeof chains],
  transport: http(),
});

export async function storeWithdraw(data: WithdrawSchema) {
  const receipt = await arkivWalletClient.mutateEntities({
    creates: [
      {
        payload: jsonToPayload({...data,protocol:"aave-v3",eventType:"Withdraw"}),
        contentType: "application/json",
        attributes: [
          { key: "protocol", value: "aave-v3" },
          { key: "eventType", value: "Withdraw" },
          { key: "reserve", value: data.reserve },
          { key: "user", value: data.user },
          { key: "to", value: data.to },
          { key: "amount", value: data.amount },
          { key: "txHash", value: data.txHash },
        ],
        expiresIn: 200,
      },
    ],
  });
  console.info("Withdraw data stored successfully:", receipt);
  return receipt
}

export async function storeSupply(data: SupplySchema) {
  const receipt = await arkivWalletClient.mutateEntities({
    creates: [
      {
        payload: jsonToPayload({...data,protocol:"aave-v3",eventType:"Supply"}),
        contentType: "application/json",
        attributes: [
            { key: 'protocol', value: 'aave-v3'},
            { key: "eventType", value: "Supply" },
            { key: "reserve", value: data.reserve },
            { key: "user", value: data.user },
            { key: "onBehalfOf", value: data.onBehalfOf },
            { key: "amount", value: data.amount },
            { key: "referralCode", value: data.referralCode },
            { key: "txHash", value: data.txHash },
        ],
        expiresIn: ExpirationTime.fromHours(24),
      },
    ],
  });
  console.info("Supply data stored successfully:", receipt);
  return receipt
}

export async function storeFlashLoan(data: FlashLoanSchema) {
  const receipt = await arkivWalletClient.mutateEntities({
    creates: [
      {
        payload: jsonToPayload({...data,protocol:"aave-v3",eventType:"FlashLoan"}),
        contentType: "application/json",
        attributes: [
            { key: 'protocol', value: 'aave-v3'},
            { key: "eventType", value: "FlashLoan" },
            { key: "target", value: data.target },
            { key: "initiator", value: data.initiator },
            { key: "asset", value: data.asset },
            { key: "amount", value: data.amount },
            { key: "interestRateMode", value: data.interestRateMode },
            { key: "premium", value: data.premium },
            { key: "referralCode", value: data.referralCode },
            { key: "txHash", value: data.txHash },
        ],
        expiresIn: ExpirationTime.fromHours(24),
      },
    ],
  });
  console.info("FlashLoan data stored successfully:", receipt);
  return receipt
}

export async function storeLiquidationCall(data: LiquidationCallSchema) {
  const receipt = await arkivWalletClient.mutateEntities({
    creates: [
      {
        payload: jsonToPayload({...data,protocol:"aave-v3",eventType:"LiquidationCall"}),
        contentType: "application/json",
        attributes: [
            { key: 'protocol', value: 'aave-v3'},
            { key: "eventType", value: "LiquidationCall" },
            { key: "collateralAsset", value: data.collateralAsset },
            { key: "debtAsset", value: data.debtAsset },
            { key: "user", value: data.user },
            { key: "debtToCover", value: data.debtToCover },
            {
                key: "liquidatedCollateralAmount",
                value: data.liquidatedCollateralAmount,
            },
            { key: "liquidator", value: data.liquidator },
            { key: "receiveAToken", value: data.receiveAToken.toString() },
            { key: "txHash", value: data.txHash },
        ],
        expiresIn: ExpirationTime.fromHours(24),
      },
    ],
  });
  console.info("LiquidationCall data stored successfully:", receipt);
  return receipt
}
