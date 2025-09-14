import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // ✅ Always store in lowercase
    },
    name: {
      type: String,
      required: true,
      default: "", // optional, user can set later
      trim: true,
    },
    deleted: {
      type: Boolean,
      default: false, // soft delete flag
    },
  },
  { timestamps: true }
);

// ✅ Ensure address is lowercase before saving (extra safety)
WalletSchema.pre("save", function (next) {
  if (this.address) {
    this.address = this.address.toLowerCase();
  }
  next();
});

export default mongoose.models.Address ||
  mongoose.model("Address", WalletSchema);
