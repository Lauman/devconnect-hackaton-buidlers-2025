import { Worker, Job } from "bullmq";
import dotenv from "dotenv";
import { storeFlashLoan, storeLiquidationCall, storeSupply, storeWithdraw } from "../arkiv.js";
import { AccionKeys, FunctionRegistry } from "../types.js";
import { MutateEntitiesReturnType } from "@arkiv-network/sdk";


dotenv.config();

const redisConnection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: +(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined
};

const rpc = process.env.RPC_URL;

const functionRegistry: FunctionRegistry = {
  "withdraw": storeWithdraw,
  "flashLoan": storeFlashLoan,
  "liquidationCall": storeLiquidationCall,
  "supply": storeSupply
};

const worker = new Worker("tx-queue", async (job: Job) => {
  console.log("Processing job", job.id, job.name, job.data);
  try {
    const nameEventAction: AccionKeys = job.name as AccionKeys
    const nameFunctionEventStore = functionRegistry[nameEventAction];
    let receipt;
    if (typeof nameFunctionEventStore === 'function') {
      receipt = await nameFunctionEventStore(job.data);
    } else {
      console.error(`Error: Action "${nameEventAction}" not found in the record.`);
    }
    console.log("Transaction mined:", receipt);
    return { ok: true };
  } catch (err) {
    console.error("Error in job:", err);
    // BullMQ will handle retries according to the job configuration
    throw err;
  }
}, { connection: redisConnection, concurrency: 1 });

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});
