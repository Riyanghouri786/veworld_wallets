import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // ensures always stored in lowercase

    },
    mnemonic: {
      type: String,
      required: true,
    },
    hashkey: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.vtho_wallet || mongoose.model("vtho_wallet", WalletSchema);
