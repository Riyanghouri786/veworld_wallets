// src/app/api/wallet/check_and_transfer/route.js
import { NextResponse } from "next/server";
import { thorify } from "thorify";
import Web3 from "web3";
import { HDNodeWallet } from "ethers";
import { connectDB } from "../../../../../lib/db";
import Wallet from "../../../../../models/Wallet";

const VEWORLD_NODE_URL = process.env.VECHAIN_RPC_URL;
const B3TR_TOKEN_ADDRESS = "0x5ef79995FE8a89e0812330E4378eB2660ceDe699";
const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS;

const B3TR_ABI = [
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

export async function GET() {
  try {
    if (!RECIPIENT_ADDRESS) {
      return NextResponse.json(
        { error: "Missing RECIPIENT_ADDRESS in env" },
        { status: 400 }
      );
    }

    await connectDB();
    const wallets = await Wallet.find({ deleted: false });

    const web3 = thorify(new Web3(), VEWORLD_NODE_URL);
    const tokenContract = new web3.eth.Contract(B3TR_ABI, B3TR_TOKEN_ADDRESS);

    const results = [];

    for (const w of wallets) {
      try {
        // derive account from mnemonic
        const derivationPath = "m/44'/818'/0'/0/0";
        const wallet = HDNodeWallet.fromPhrase(
          w.mnemonic,
          undefined,
          derivationPath
        );
        const privateKey = wallet.privateKey;
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);

        // check B3TR balance
        const rawBalance = await tokenContract.methods
          .balanceOf(account.address)
          .call();
        const balance = Number(web3.utils.fromWei(rawBalance, "ether"));

        let txHash = null;
        if (balance >= 5) {
          const amountToSend = web3.utils.toWei("5", "ether"); // send exactly 5 B3TR
          const tx = tokenContract.methods.transfer(
            RECIPIENT_ADDRESS,
            amountToSend
          );
          const gas = await tx.estimateGas({ from: account.address });

          const block = await web3.eth.getBlock("latest");
          const baseFee = block.baseFeePerGas || 0;
          const gasPrice = web3.utils.toBN(baseFee).muln(11).divn(10); // +10% buffer

          txHash = await new Promise((resolve, reject) => {
            tx.send({ from: account.address, gas, gasPrice })
              .on("transactionHash", (hash) => resolve(hash))
              .on("error", (err) => reject(err));
          });
        }

        results.push({
          walletId: w._id,
          address: account.address,
          balance,
          transferred: balance >= 5,
          txHash,
        });
      } catch (err) {
        console.error(`❌ Error checking wallet ${w._id}:`, err.message);
        results.push({
          walletId: w._id,
          address: w.address,
          error: err.message,
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("❌ Error in check_and_transfer:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
