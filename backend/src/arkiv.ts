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
import { WithdrawSchema } from "./types.js";
import { jsonToPayload, stringToPayload } from '@arkiv-network/sdk/utils';
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
    transport: http('https://mendoza.hoodi.arkiv.network/rpc'),
    account: privateKeyToAccount(process.env.ARKIV_PRIVATE_KEY as `0x${string}`),
  });

const arkivPublicClient = createPublicClient({
	chain: chains[process.env.ARKIV_CHAIN as keyof typeof chains],
	transport: http(),
});


export async function storeWithdraw(data: WithdrawSchema) {

console.log("store withdraw")

const receipt = await arkivWalletClient.mutateEntities({
    creates: [
        {
            payload: jsonToPayload(data),
            contentType: 'application/json',
            attributes: [
            { key: 'reserve', value: data.reserve },
            { key: 'user', value: data.user },
            { key: 'to', value: data.to },
            { key: 'amount', value: data.amount},
            {key: "txHash", value: data.txHash}
            ],
            expiresIn: 200,
        },
        ],
});
console.info("Data stored successfully:", receipt);
return receipt
}

