import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    let balance = "0.00";
    let symbol = "";
    let priceUSD = 0;
    let pricePKR = 0;
    let totalValueUSD = "0.00";
    let totalValuePKR = "0.00";

    try {
      // 🔹 Fetch VeChain account info
      const response = await fetch(
        `https://explore.vechain.org/api/accounts/${address}`,
        { cache: "no-store" } // disable caching
      );

      if (response.ok) {
        const data = await response.json();

        if (data?.tokens && data.tokens.length > 0) {
          const token = data.tokens[0];
          symbol = token.symbol || "TOKEN";

          const raw = Number(token.balance) / 10 ** token.decimals;
          balance = raw.toFixed(2);

          // 🔹 Fetch price in USD + PKR
          const priceRes = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=vebetterdao&vs_currencies=usd,pkr`
          );

          if (priceRes.ok) {
            const priceData = await priceRes.json();
            priceUSD = priceData?.vebetterdao?.usd || 0;
            pricePKR = priceData?.vebetterdao?.pkr || 0;

            totalValueUSD = (raw * priceUSD).toFixed(2);
            totalValuePKR = (raw * pricePKR).toFixed(2);
          }
        }
      } else {
        console.warn(`⚠️ Skipping invalid address: ${address}`);
      }
    } catch (err) {
      console.warn(`⚠️ Error processing address ${address}:`, err.message);
    }

    return NextResponse.json({
      success: true,
      address,
      symbol,
      balance,
      priceUSD,
      totalValueUSD,
      pricePKR,
      totalValuePKR,
    });
  } catch (error) {
    console.error("❌ Error fetching data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
