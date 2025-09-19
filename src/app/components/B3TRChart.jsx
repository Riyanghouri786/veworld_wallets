"use client";
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const B3TRChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // 👉 Current USD to PKR conversion rate (you can fetch dynamically if needed)
  const usdToPkr = 285; // Example rate: 1 USD = 280 PKR

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/vebetterdao/market_chart?vs_currency=usd&days=1"
      );
      const json = await res.json();

      if (json.prices && Array.isArray(json.prices)) {
        const formatted = json.prices.map((p) => ({
          time: new Date(p[0]).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          price: p[1],
        }));
        setData(formatted);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        console.error("Unexpected data format from CoinGecko:", json);
      }
    } catch (err) {
      console.error("Error fetching B3TR data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceData();
    const interval = setInterval(fetchPriceData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-700 p-5 rounded-2xl shadow-lg w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-green-400">
          B3TR Price (24h)
        </h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400 hidden sm:block">
              Updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchPriceData}
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="h-64 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              {/* Grid */}
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

              {/* Axis */}
              <XAxis
                dataKey="time"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                domain={["auto", "auto"]}
                axisLine={false}
                tickLine={false}
              />

              {/* Custom Tooltip */}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value) => [
                  <>
                    <div className="text-sm">
                      <span className="font-semibold text-green-400">
                        ${value.toFixed(5)} USDT
                      </span>
                      <br />
                      <span className="text-gray-300">
                        {(value * usdToPkr).toFixed(2)} PKR
                      </span>
                    </div>
                  </>,
                  "Price",
                ]}
              />

              {/* Gradient Line */}
              <defs>
                <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <Line
                type="monotone"
                dataKey="price"
                stroke="url(#lineColor)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm">
          Loading chart data...
        </p>
      )}
    </div>
  );
};

export default B3TRChart;
