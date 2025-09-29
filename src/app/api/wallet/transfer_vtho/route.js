import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import Wallet from "../../../../../models/Wallet";
import vtho_wallet from "../../../../../models/VthoWallet";
import { thorify } from "thorify";
import Web3 from "web3";

const VEWORLD_NODE_URL = process.env.VECHAIN_RPC_URL;

// Minimal ABI for VTHO (ERC20 standard)
const VTHO_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
];

// VTHO token contract address on VeChain
const VTHO_TOKEN_ADDRESS = "0x0000000000000000000000000000456E65726779"; // VTHO

// Helper: fetch account energy from explorer
async function getWalletEnergy(address) {
  try {
    // normalize address before hitting the API
    const normalized = address.toLowerCase();

    const url = `https://explore.vechain.org/api/accounts/${normalized}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Explorer returned ${res.status} for ${normalized}`);
    }

    const data = await res.json();

    // Sometimes it's nested differently, so we normalize
    const energyHex =
      data?.account?.energy ||
      data?.energy ||
      data?.data?.energy ||
      "0x0";

    const energy = parseInt(energyHex, 16) / 1e18; // VTHO value
    return isNaN(energy) ? 0 : energy;
  } catch (err) {
    console.error(`⚠️ Failed to fetch energy for ${address}:`, err.message);
    return 0; // fallback so script continues
  }
}



export async function GET() {
  try {
    await connectDB();

    // 1. Get all wallets
    const wallets = await Wallet.find({ deleted: false });

    // 2. Setup web3 + token contract
    const web3 = thorify(new Web3(), VEWORLD_NODE_URL);
    const vthoToken = new web3.eth.Contract(VTHO_ABI, VTHO_TOKEN_ADDRESS);

    const results = [];

    for (const w of wallets) {
      try {
        const energy = await getWalletEnergy(w.address);

        let txHash = null;
        if (energy < 10) {
          // 3. Get a funded vtho_wallet
          const vthoWallets = await vtho_wallet.find({ deleted: false }).sort({
            createdAt: -1,
          });

          if (!vthoWallets.length) {
            throw new Error("No VTHO wallets available for funding");
          }

          const donor = vthoWallets[0]; // use the first one
          const account = web3.eth.accounts.privateKeyToAccount(
            "0x" + donor.hashkey
          );
          web3.eth.accounts.wallet.add(account);

          // send 20 VTHO (top-up amount, adjust as needed)
          const amountToSend = web3.utils.toWei("20", "ether");

          const tx = vthoToken.methods.transfer(w.address, amountToSend);
          const gas = await tx.estimateGas({ from: account.address });

          txHash = await new Promise((resolve, reject) => {
            tx.send({ from: account.address, gas })
              .on("transactionHash", (hash) => resolve(hash))
              .on("error", (err) => reject(err));
          });
        }

        results.push({
          walletId: w._id,
          address: w.address,
          energy,
          funded: energy < 10,
          txHash,
        });
      } catch (err) {
        console.error(`❌ Error processing wallet ${w._id}:`, err.message);
        results.push({
          walletId: w._id,
          address: w.address,
          error: err.message,
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("❌ Error in transfer_vtho:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
