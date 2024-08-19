import mongoose from "mongoose";
import OrderCount from "./orderCountModel.js";

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  product: [
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
      quantity: {
        type: Number,
      },
      price: {
        type: Number,
      },
    },
  ],
  orderID: {
    type: String,
  },
  paymentMethod: {
    type: String,
  },
  total: {
    type: Number,
  },
  status: {
    type: String,
    default: "Processing",
  },
  deliveryType: {
    type: {
      type: String,
    },
    additionalNotes: {
      type: String,
    },
  },
  createdAt: {
    type: Date,
    default: () => {
      const date = new Date();
      const timeZoneOffset = 5.5 * 60 * 60 * 1000;
      const indianDate = new Date(date.getTime() + timeZoneOffset);
      return indianDate;
    },
  },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
