// src/app/api/transfer/route.js
import { thorify } from "thorify";
import Web3 from "web3";

const VEWORLD_NODE_URL = process.env.VECHAIN_RPC_URL;
const B3TR_TOKEN_ADDRESS = "0x5ef79995FE8a89e0812330E4378eB2660ceDe699";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS; // 👈 set this in your env

const B3TR_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function"
  }
];

export async function POST(req) {
  try {
    const { amount, symbol } = await req.json();

    if (!PRIVATE_KEY || PRIVATE_KEY.length !== 64) {
      return new Response(JSON.stringify({ error: "Invalid private key in env" }), { status: 400 });
    }

    if (!RECIPIENT_ADDRESS) {
      return new Response(JSON.stringify({ error: "Missing RECIPIENT_ADDRESS env" }), { status: 400 });
    }

    if (!amount || !symbol) {
      return new Response(JSON.stringify({ error: "Missing amount or symbol" }), { status: 400 });
    }

    const web3 = thorify(new Web3(), VEWORLD_NODE_URL);
    const account = web3.eth.accounts.privateKeyToAccount("0x" + PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);

    let txHash;

    if (symbol.toUpperCase() === "B3TR") {
      const tokenContract = new web3.eth.Contract(B3TR_ABI, B3TR_TOKEN_ADDRESS);
      const decimals = 18;
      const tokenAmount = web3.utils.toBN(
        (parseFloat(amount) * 10 ** decimals).toLocaleString("fullwide", { useGrouping: false })
      );

      const tx = tokenContract.methods.transfer(RECIPIENT_ADDRESS, tokenAmount);
      const gas = await tx.estimateGas({ from: account.address });

      txHash = await new Promise((resolve, reject) => {
        tx.send({ from: account.address, gas })
          .on("transactionHash", (hash) => resolve(hash))
          .on("error", (err) => reject(err));
      });

    } else if (symbol.toUpperCase() === "VET") {
      const value = web3.utils.toWei(amount.toString(), "ether");

      txHash = await new Promise((resolve, reject) => {
        web3.eth.sendTransaction({ from: account.address, to: RECIPIENT_ADDRESS, value })
          .on("transactionHash", (hash) => resolve(hash))
          .on("error", (err) => reject(err));
      });

    } else {
      return new Response(JSON.stringify({ error: "Unsupported token symbol" }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, txHash }), { status: 200 });

  } catch (err) {
    console.error("transfer error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
