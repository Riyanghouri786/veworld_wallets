"use client";
import { useEffect, useState } from "react";
import SkeletonLoader from "./components/SkeletonLoader";
import toast from "react-hot-toast";
import { FiCopy } from "react-icons/fi";
import { FaEllipsisV } from "react-icons/fa";
import SendTokenModal from "./components/SendTokenModal";
import AddWalletModal from "./components/AddWalletModal";

export default function WalletsPage() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🚀 Modal states
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 🔎 Search state
  const [searchTerm, setSearchTerm] = useState("");

  const openSendModal = (wallet) => {
    setSelectedWallet(wallet); // wallet contains address + key
    setIsSendModalOpen(true);
  };

  const closeSendModal = () => {
    setSelectedWallet(null);
    setIsSendModalOpen(false);
  };

  const copyToClipboard = (text, label) => {
    const lowerText = text?.toLowerCase() || "";
    navigator.clipboard.writeText(lowerText);
    toast.success(`${label} copied ✅`, { position: "top-right" });
  };

  const shortenText = (text) => {
    if (!text) return "-";
    const lowerText = text.toLowerCase();
    if (lowerText.length <= 10) return lowerText;
    return `${lowerText.slice(0, 5)}.....${lowerText.slice(-5)}`;
  };

  const fetchWallets = async () => {
    try {
      const res = await fetch("/api/wallet/list");
      const data = await res.json();
      const walletsData = data.wallets || [];

      const walletsWithBalance = await Promise.all(
        walletsData.map(async (wallet) => {
          try {
            const balanceRes = await fetch(
              `/api/wallet/wallet_balance?address=${wallet.address}`
            );
            const balanceData = await balanceRes.json();
            return {
              ...wallet,
              b3trBalance: balanceData?.b3trBalance ?? 0,
            };
          } catch {
            return { ...wallet, b3trBalance: 0 };
          }
        })
      );

      setWallets(walletsWithBalance);
    } catch (err) {
      console.error("Error fetching wallets:", err);
      toast.error("Failed to load wallets ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  // 🔎 Filter wallets by name
  const filteredWallets = wallets.filter((wallet) =>
    wallet.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-sm">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">💳 All Wallets</h1>

          <div className="flex gap-3 w-full md:w-auto">
            {/* 🔎 Search Input */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search wallet by name..."
              className="flex-1 md:flex-none px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            {/* ➕ Add Wallet Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              + Add Wallet
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wider">
                <th className="py-3 px-4 text-center">#</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Wallet Address</th>
                <th className="py-3 px-4">Balance (B3TR)</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-3 px-4 text-center">
                      <SkeletonLoader width="20px" height="15px" />
                    </td>
                    <td className="py-3 px-4">
                      <SkeletonLoader width="80px" />
                    </td>
                    <td className="py-3 px-4">
                      <SkeletonLoader width="150px" />
                    </td>
                    <td className="py-3 px-4">
                      <SkeletonLoader width="60px" />
                    </td>
                    <td className="py-3 px-4">
                      <SkeletonLoader width="60px" />
                    </td>
                  </tr>
                ))
              ) : filteredWallets.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No wallets found 🚫
                  </td>
                </tr>
              ) : (
                filteredWallets.map((wallet, index) => (
                  <tr
                    key={wallet._id} // ✅ use Mongo _id
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-medium text-gray-700">
                      {index + 1}
                    </td>
                    <td className="text-center font-semibold text-gray-800">
                      {wallet.name || "-"}
                    </td>
                    <td className="text-center font-semibold text-gray-700">
                      {shortenText(wallet.address)}
                      <button
                        onClick={() =>
                          copyToClipboard(wallet.address, "Address")
                        }
                        className="p-1 rounded hover:bg-blue-100 text-blue-600 transition"
                      >
                        <FiCopy />
                      </button>
                    </td>
                    <td className="text-center font-semibold">
                      <span className="text-green-500">B3TR :</span>{" "}
                      {wallet.b3trBalance}
                    </td>
                    <td className="text-center py-3 px-4">
                      <button
                        onClick={() => openSendModal(wallet)} // ✅ pass wallet with _id
                        className="p-2 rounded hover:bg-gray-100"
                      >
                        <FaEllipsisV size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <SendTokenModal
        isOpen={isSendModalOpen}
        onClose={closeSendModal}
        wallet={selectedWallet} // ✅ wallet has _id
      />

      <AddWalletModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onWalletAdded={fetchWallets}
      />
    </div>
  );
}
