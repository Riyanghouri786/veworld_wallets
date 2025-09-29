"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiX } from "react-icons/fi";

export default function AddWalletModal({ isOpen, onClose, onWalletAdded }) {
  const [mnemonic, setMnemonic] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/wallet/add_wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mnemonic, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add wallet");
      }

      toast.success("Wallet added successfully 🎉");
      setMnemonic("");
      setName("");
      onClose();
      onWalletAdded?.(); // refresh wallets
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error adding wallet ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">➕ Add New Wallet</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Mnemonic Phrase
            </label>
            <input
              type="password"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         outline-none transition"
              placeholder="Enter mnemonic"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Wallet Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         outline-none transition"
              placeholder="My Wallet"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 
                         hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium 
                         shadow hover:bg-blue-700 disabled:opacity-70 transition"
            >
              {loading ? "Adding..." : "Add Wallet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
