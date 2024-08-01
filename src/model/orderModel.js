import mongoose from "mongoose";
  
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
  // createdAt: {
  //   type: Date,
  //   default: Date.now,
  // },
  createdAt: {
    type: Date,
    default: () => {
      const date = new Date();
      // Get the timezone offset for Indian Standard Time (IST) in milliseconds
      const timeZoneOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      // Apply the offset to the current date
      const indianDate = new Date(date.getTime() + timeZoneOffset);
      return indianDate;
    }
  }
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
