import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
  ],
  subCategorys: [
    {
      name: String,
    },
  ],
  isTopCategory: {
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

const Category = mongoose.model("Category", categorySchema);
export default Category;
