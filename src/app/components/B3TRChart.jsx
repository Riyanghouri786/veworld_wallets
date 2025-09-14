"use client";
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const B3TRChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

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
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow mb-4 w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-bold">B3TR Price (24h)</h2>
        <button
          onClick={fetchPriceData}
          disabled={loading}
          className="bg-gray-700 hover:bg-gray-600 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {data.length > 0 ? (
        <div className="h-60 sm:h-72 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="time" tick={{ fill: "#aaa", fontSize: 10 }} />
              <YAxis
                tick={{ fill: "#aaa", fontSize: 10 }}
                domain={["auto", "auto"]}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
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
