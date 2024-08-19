import mongoose from "mongoose";

const orderCountSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("OrderCount", orderCountSchema);
