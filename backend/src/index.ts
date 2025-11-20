import { ethers } from "ethers";
import dotenv from "dotenv";
import { storeWithdraw, storeSupply, storeFlashLoan, storeLiquidationCall } from "./arkiv.js";
import { Queue } from "bullmq";

dotenv.config();
const redisConnection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: +(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined
};

const queue = new Queue("tx-queue", { connection: redisConnection });
async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  const abi = [
    "event Withdraw(address indexed reserve, address indexed user, address indexed to, uint256 amount)",
    "event Supply(address indexed reserve,address user,address indexed onBehalfOf,uint256 amount,uint16 indexed referralCode)",
    "event FlashLoan(address indexed target,address initiator,address indexed asset,uint256 amount,uint8 interestRateMode,uint256 premium,uint16 indexed referralCode)",
    "event LiquidationCall(address indexed collateralAsset,address indexed debtAsset,address indexed user,uint256 debtToCover,uint256 liquidatedCollateralAmount,address liquidator,bool receiveAToken)"
  ];

  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS!,
    abi,
    provider
  );

  console.log("👂 Listener events...");
  /**
   * @dev Emitted on withdraw()
   * @param reserve The address of the underlying asset being withdrawn
   * @param user The address initiating the withdrawal, owner of aTokens
   * @param to The address that will receive the underlying
   * @param amount The amount to be withdrawn
   */
  contract.on("Withdraw", async (reserve, user, to, amount, event) => {
    console.log("📢 Event Withdraw detected:");
    //console.log(" Event:", event);
    console.log(" reserve:", reserve);
    console.log(" user:", user);
    console.log(" to:", to);
    console.log(" amount:", amount.toString());
    console.log(" Tx hash:", event.log.transactionHash);

    await handleEventWithdraw("withdraw",reserve, user,to, amount,event.log.transactionHash);
  });
  /**
 * @dev Emitted on supply()
 * @param reserve The address of the underlying asset of the reserve
 * @param user The address initiating the supply
 * @param onBehalfOf The beneficiary of the supply, receiving the aTokens
 * @param amount The amount supplied
 * @param referralCode The referral code used
 */
  contract.on("Supply", async (reserve, user, onBehalfOf, amount, referralCode, event) => {
    console.log("📢 Event Supply detected:");
    //console.log(" Event:", event);
    console.log(" reserve:", reserve);
    console.log(" user:", user);
    console.log(" onBehalfOf:", onBehalfOf);
    console.log(" amount:", amount.toString());
    console.log(" referralCode:", referralCode);
    console.log(" Tx hash:", event.log.transactionHash);

    await handleEventSupply("supply",reserve, user, onBehalfOf,amount,referralCode, event.log.transactionHash);
  });

  /**
 * @dev Emitted on flashLoan()
 * @param target The address of the flash loan receiver contract
 * @param initiator The address initiating the flash loan
 * @param asset The address of the asset being flash borrowed
 * @param amount The amount flash borrowed
 * @param interestRateMode The flashloan mode: 0 for regular flashloan,
 *        1 for Stable (Deprecated on v3.2.0), 2 for Variable
 * @param premium The fee flash borrowed
 * @param referralCode The referral code used
 */
  contract.on("FlashLoan", async (target, initiator, asset, amount, interestRateMode, premium, referralCode, event) => {
    console.log("📢 Event FlashLoan detected:");
    //console.log(" Event:", event);
    console.log(" target:", target);
    console.log(" initiator:", initiator);
    console.log(" asset:", asset);
    console.log(" amount:", amount.toString());
    console.log(" interestRateMode:", interestRateMode);
    console.log(" premium:", premium);
    console.log(" referralCode:", referralCode);
    console.log(" Tx hash:", event.log.transactionHash);

    await handleEventFlashLoan("flashLoan",target, initiator, asset,amount,interestRateMode,premium,referralCode,event.log.transactionHash);
  });

  contract.on("LiquidationCall", async (collateralAsset, debtAsset, user, debtToCover, liquidatedCollateralAmount, liquidator, receiveAToken, event) => {
    console.log("📢 Event LiquidationCall detected:");
    //console.log(" Event:", event);
    console.log(" collateralAsset:", collateralAsset);
    console.log(" debtAsset:", debtAsset);
    console.log(" user:", user);
    console.log(" debtToCover:", debtToCover);
    console.log(" liquidatedCollateralAmount:", liquidatedCollateralAmount.toString());
    console.log(" liquidator:", liquidator);
    console.log(" receiveAToken:", receiveAToken);
    console.log(" Tx hash:", event.log.transactionHash);

    await handleEventLiquidationCall("liquidationCall",collateralAsset, debtAsset, user,debtToCover,liquidatedCollateralAmount,liquidator,receiveAToken,event.log.transactionHash);
  });
}

async function handleEventWithdraw(event: string, reserve: string, user: string, to: string, amount: bigint,txHash: string) {
  console.log("saving withdraw data")
  const data = {reserve, user, to, amount: amount.toString(), txHash}
  await addNewQueue(event,data)
  
  console.log("data saved")
}

async function handleEventSupply(event: string, reserve: string, user: string, onBehalfOf: string, amount: bigint, referralCode: bigint,txHash: string) {
  console.log("⚙ Execute handleEventWithdraw...");
  const data = {reserve, user, onBehalfOf, amount: amount.toString(), referralCode: referralCode.toString(), txHash}
  await addNewQueue(event,data)
}

async function handleEventFlashLoan(event: string, target: string, initiator: string, asset: string, amount: bigint, interestRateMode: bigint, premium: bigint, referralCode: bigint,txHash: string) {
  console.log("⚙ Execute handleEventFlashLoan...");
  const data = {target, initiator, asset,  amount: amount.toString(), interestRateMode: interestRateMode.toString(), premium: premium.toString(), referralCode: referralCode.toString(),txHash}
  await addNewQueue(event,data)
}

async function handleEventLiquidationCall(event: string, collateralAsset : string, debtAsset : string, user : string, debtToCover : bigint, liquidatedCollateralAmount : bigint, liquidator : string, receiveAToken : boolean,txHash: string) {
  console.log("⚙ Execute handleEventFlashLoan...");
  const data = {collateralAsset, debtAsset, user, debtToCover: debtToCover.toString(), liquidatedCollateralAmount: liquidatedCollateralAmount.toString(),liquidator,receiveAToken,txHash}
  await addNewQueue(event,data)
}

async function addNewQueue(event: string, data: any){
    await queue.add(event, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 }
    });
}

main().catch(console.error);
