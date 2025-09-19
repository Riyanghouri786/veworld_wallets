"use client";
import React, { useEffect, useState } from "react";
import { FaArrowUp, FaSyncAlt, FaPaperPlane } from "react-icons/fa";
import B3TRChart from "../components/B3TRChart";
import VeChainExplorer from "../components/Transfer";

const SkeletonLoader = ({ width = "100%", height = "1rem", className = "" }) => {
  return (
    <div
      className={`bg-gray-700 animate-pulse rounded ${className}`}
      style={{ width, height }}
    ></div>
  );
};

const Dashboard = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [refreshing, setRefreshing] = useState({}); // track per-wallet refresh
  const [explorerAddress, setExplorerAddress] = useState("");

  // Fetch all wallets
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const res = await fetch("/api/address");
        const result = await res.json();

        if (result.success && result.data.length > 0) {
          const balances = await Promise.all(
            result.data.map(async (wallet) => {
              const balRes = await fetch("/api/address/balance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: wallet.address }),
              });
              const balData = await balRes.json();

              return {
                ...wallet,
                balance: balData?.balance || "0.00",
                symbol: balData?.symbol || "N/A",
                priceUSD: balData?.priceUSD || 0,
                pricePKR: balData?.pricePKR || 0,
                totalValueUSD: balData?.totalValueUSD || "0.00",
                totalValuePKR: balData?.totalValuePKR || "0.00",
              };
            })
          );
          setWallets(balances);
        }
      } catch (error) {
        console.error("Error fetching wallets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallets();
  }, []);

  // Refresh balance of a single wallet
  const handleRefresh = async (walletId, address) => {
    try {
      setRefreshing((prev) => ({ ...prev, [walletId]: true }));

      const balRes = await fetch("/api/address/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const balData = await balRes.json();

      setWallets((prev) =>
        prev.map((w) =>
          w._id === walletId
            ? {
              ...w,
              balance: balData?.balance || "0.00",
              symbol: balData?.symbol || w.symbol,
              priceUSD: balData?.priceUSD || 0,
              pricePKR: balData?.pricePKR || 0,
              totalValueUSD: balData?.totalValueUSD || "0.00",
              totalValuePKR: balData?.totalValuePKR || "0.00",
            }
            : w
        )
      );
    } catch (err) {
      console.error("Error refreshing balance:", err);
    } finally {
      setRefreshing((prev) => ({ ...prev, [walletId]: false }));
    }
  };

  // Add new wallet
  const handleAddWallet = async () => {
    try {
      const res = await fetch("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, name }),
      });

      const data = await res.json();
      if (data.success) {
        setWallets((prev) => [...prev, data.data]);
        setShowModal(false);
        setAddress("");
        setName("");
      } else {
        alert(data.error || "Failed to add wallet");
      }
    } catch (err) {
      console.error("Error adding wallet:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      {/* Balance Card */}
      <B3TRChart />

      <div className="bg-gray-900 p-6 mt-2 rounded-2xl mb-6 shadow-lg border border-gray-700">
        {/* Header */}
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          Total Balance
        </h2>

        {/* Balance */}
        <div className="mt-2">
          <p className="text-4xl font-extrabold text-white flex items-baseline gap-2">
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              $
              {wallets
                .reduce((acc, w) => acc + Number(w.totalValueUSD || 0), 0)
                .toFixed(2)}
            </span>
            <span className="text-lg text-gray-400">
              / PKR{" "}
              {wallets
                .reduce((acc, w) => acc + Number(w.totalValuePKR || 0), 0)
                .toFixed(2)}
            </span>
          </p>
        </div>

        {/* Growth */}
        <p className="text-green-400 flex items-center gap-1 text-sm mt-3">
          <FaArrowUp className="animate-bounce" /> +5.24%
        </p>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-green-500/30 transition"
            onClick={() => setShowModal(true)}
          >
            <span className="text-lg">＋</span> Add Wallet
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-gray-300 font-medium transition">
            View Details
          </button>
        </div>
      </div>


      {/* Wallets */}
      <h3 className="text-lg font-bold text-gray-200 mb-4">My Wallets</h3>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-gray-800/70 rounded-2xl p-5 shadow-md flex flex-col gap-3 animate-pulse"
              >
                <SkeletonLoader width="60%" height="1.2rem" />
                <SkeletonLoader width="40%" height="1rem" />
                <SkeletonLoader width="80%" height="2rem" />
                <SkeletonLoader width="50%" height="1.5rem" />
              </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {wallets.map((wallet, i) => (
            <div
              key={wallet._id}
              className={`relative overflow-hidden rounded-2xl p-5 shadow-lg transition hover:scale-[1.02] hover:shadow-2xl group
          ${[
                  "bg-gradient-to-r from-blue-500 to-blue-700",
                  "bg-gradient-to-r from-purple-600 to-indigo-700",
                  "bg-gradient-to-r from-teal-500 to-emerald-700",
                  "bg-gradient-to-r from-yellow-500 to-amber-600",
                ][i % 4]
                }`}
            >
              {/* Floating action buttons */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  className="bg-black/30 hover:bg-black/50 p-2 rounded-full text-white transition"
                  onClick={() => setExplorerAddress(wallet.address)}
                >
                  <FaPaperPlane size={14} />
                </button>
                <button
                  className="bg-black/30 hover:bg-black/50 p-2 rounded-full text-white transition"
                  onClick={() => handleRefresh(wallet._id, wallet.address)}
                  disabled={refreshing[wallet._id]}
                >
                  <FaSyncAlt
                    size={14}
                    className={`${refreshing[wallet._id] ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {/* Wallet Info */}
              <p className="text-lg font-semibold text-white">
                {wallet.name}
              </p>
              <p className="text-sm text-gray-200">{wallet.symbol}</p>

              {/* Balance */}
              <p className="text-3xl font-bold mt-2 text-white drop-shadow-sm">
                {wallet.balance} {wallet.symbol}
              </p>

              {/* Value */}
              <p className="text-md font-semibold mt-1">
                <span className="text-green-100">${wallet.totalValueUSD} USD</span>
                <span className="text-gray-200"> / ₨{wallet.totalValuePKR} PKR</span>
              </p>
            </div>
          ))}
        </div>
      )}


      {/* Modal for Add Wallet */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 p-6 rounded-2xl w-[95%] sm:w-[400px] shadow-2xl border border-gray-700 transform transition-all scale-100">
            <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Add Wallet
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Wallet Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-400 outline-none border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
              />
              <input
                type="text"
                placeholder="Wallet Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-400 outline-none border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 shadow-md hover:shadow-green-500/30 transition"
                onClick={handleAddWallet}
              >
                + Add Wallet
              </button>
            </div>
          </div>
        </div>

      )}
      {explorerAddress && (
        <VeChainExplorer address={explorerAddress} />
      )}
    </main>
  );
};

export default Dashboard;
