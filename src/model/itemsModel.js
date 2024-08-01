 
import mongoose from "mongoose";

const itemSchema = mongoose.Schema({
  itemId: {
    type: String,
  },
  itemTitle: {
    type: String,
    required: true,
  },
  itemDescription: {
    type: String,
    required: true,
  },
  images: [
    {
      type: String,
      required: true,
    },
  ],
  subCategory: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  
  },
  subCategoryId: {
    type: String,
    required: true,
  },
  actualPrice: {
    type: Number,
    required: true,
  },

  discountPercentage: {
    type: Number,
    required: true,
  },

  stock: {
    type: Number,
    required: true,
  },

  highlights: {
    type: String,
  },

  isSale: {
    type: Boolean,
    default: false,
  },

  isTrending: {
    type: Boolean,
    default: false,
  },
 
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

const Item = mongoose.model("Item", itemSchema);
export default Item;

 