// app/api/wallet/new/route.js
import { NextResponse } from "next/server";
import { ethers } from "ethers";

export async function GET() {
  try {
    // Generate random mnemonic (12 words)
    const wallet = ethers.Wallet.createRandom();

    const mnemonic = wallet.mnemonic?.phrase; // 12-word recovery phrase
    const address = wallet.address;           // Public address
    const privateKey = wallet.privateKey;     // 65-char private key (hex)

    return NextResponse.json({
      address,
      privateKey,
      mnemonic,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create wallet" },
      { status: 500 }
    );
  }
}
