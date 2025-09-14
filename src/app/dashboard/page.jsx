"use client";
import React, { useEffect, useState } from "react";
import { FaArrowUp, FaSyncAlt } from "react-icons/fa";
import B3TRChart from "../components/B3TRChart";

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
      <B3TRChart/>

      <div className="bg-gray-800 p-5 rounded-2xl mb-6 shadow">
        <h2 className="text-lg text-gray-300">Total Balance</h2>
        <p className="text-3xl font-bold">
          $
          {wallets
            .reduce((acc, w) => acc + Number(w.totalValueUSD || 0), 0)
            .toFixed(2)}{" "}
          / PKR{" "}
          {wallets
            .reduce((acc, w) => acc + Number(w.totalValuePKR || 0), 0)
            .toFixed(2)}
        </p>
        <p className="text-green-400 flex items-center gap-1 text-sm">
          <FaArrowUp /> 5.24%
        </p>
        <div className="flex gap-2 mt-4">
          <button
            className="bg-gray-700 px-3 py-2 rounded-lg"
            onClick={() => setShowModal(true)}
          >
            + Add Wallet
          </button>
        </div>
      </div>

      {/* Wallets */}
      <h3 className="text-lg mb-3">Wallets</h3>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-3"
              >
                <SkeletonLoader width="60%" height="1.2rem" />
                <SkeletonLoader width="40%" height="1rem" />
                <SkeletonLoader width="80%" height="2rem" />
                <SkeletonLoader width="50%" height="1.5rem" />
              </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {wallets.map((wallet, i) => (
            <div
              key={wallet._id}
              className={`relative ${
                ["bg-blue-600", "bg-purple-700", "bg-teal-600", "bg-yellow-700"][
                  i % 4
                ]
              } rounded-xl p-4 shadow`}
            >
              {/* Refresh button */}
              <button
                className="absolute top-2 right-2 text-white hover:scale-110 transition"
                onClick={() => handleRefresh(wallet._id, wallet.address)}
                disabled={refreshing[wallet._id]}
              >
                <FaSyncAlt
                  className={`${
                    refreshing[wallet._id] ? "animate-spin" : ""
                  }`}
                />
              </button>

              <p className="text-lg font-semibold">{wallet.name}</p>
              <p className="text-sm text-gray-300">{wallet.symbol}</p>
              <p className="text-2xl font-bold">
                {wallet.balance} {wallet.symbol}
              </p>
              <p className="text-md font-semibold text-green-300">
                ${wallet.totalValueUSD} USD / ₨{wallet.totalValuePKR} PKR
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add Wallet */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add Wallet</h2>
            <input
              type="text"
              placeholder="Wallet Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded mb-3 bg-gray-700 text-white outline-none"
            />
            <input
              type="text"
              placeholder="Wallet Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 rounded mb-3 bg-gray-700 text-white outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                className="bg-gray-600 px-4 py-2 rounded-lg"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 px-4 py-2 rounded-lg"
                onClick={handleAddWallet}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default Dashboard;
