import {
	createPublicClient,
	createWalletClient,
	defineChain,
	type Entity,
	http,
} from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { kaolin, localhost } from "@arkiv-network/sdk/chains";
import type { Chain } from "viem";
import { WithdrawSchema } from "./types";
import { jsonToPayload } from '@arkiv-network/sdk/utils';

const chains = {
	kaolin: kaolin,
	localhost: localhost,
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
	chain: chains[process.env.ARKIV_CHAIN as keyof typeof chains],
	transport: http(),
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
            contentType: 'text/plain',
            attributes: [
            { key: 'type', value: 'withdraw' },
            { key: 'choice', value: 'no' },
            { key: 'weight', value: '1' },
            ],
            expiresIn: 200,
        },
        ],
});
console.info("Data stored successfully:", receipt);
}

