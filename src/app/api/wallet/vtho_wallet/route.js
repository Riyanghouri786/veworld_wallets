import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import vtho_wallet from "../../../../../models/VthoWallet";
import { HDNodeWallet } from "ethers";

// ✅ POST new vtho wallet
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { mnemonic, name } = body;

    if (!mnemonic || typeof mnemonic !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid mnemonic phrase." },
        { status: 400 }
      );
    }

    // validate 12/24 words
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return NextResponse.json(
        { error: "Mnemonic phrase must be either 12 or 24 words." },
        { status: 400 }
      );
    }

    let wallet;
    try {
      // derive first account with VeChain's BIP44 path
      const derivationPath = "m/44'/818'/0'/0/0";
      wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath);
    } catch (e) {
      return NextResponse.json(
        { error: "The provided mnemonic is invalid. Please check and try again." },
        { status: 400 }
      );
    }

    const privateKeyHex = wallet.privateKey.replace(/^0x/, "");
    if (privateKeyHex.length !== 64) {
      return NextResponse.json(
        { error: "Unexpected error: derived private key length is invalid." },
        { status: 500 }
      );
    }

    const address = wallet.address;

    // Save to DB
    const newWallet = await vtho_wallet.create({
      address,
      mnemonic,
      hashkey: privateKeyHex,
      name: name || "",
    });

    return NextResponse.json(
      {
        success: true,
        wallet: {
          id: newWallet._id,
          address,
          hashkey: privateKeyHex,
          name: newWallet.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST VTHO Wallet Error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "This VTHO wallet is already added." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong while adding the VTHO wallet. Please try again." },
      { status: 500 }
    );
  }
}

// ✅ GET all vtho wallets
export async function GET() {
  try {
    await connectDB();

    const wallets = await vtho_wallet.find({ deleted: false }).sort({
      createdAt: -1,
    });

    return NextResponse.json(wallets, { status: 200 });
  } catch (error) {
    console.error("GET VTHO Wallets Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch VTHO wallets" },
      { status: 500 }
    );
  }
}
