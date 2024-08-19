import _ from "lodash";
import AppSuccess from "../utils/response-handlers/app-success.js";
import { BADREQUEST, SUCCESS } from "../utils/constants/statusCode.js";
import AppError from "../utils/response-handlers/app-error.js";
import { validateCreateItem } from "../utils/validator/validateItem.js";
import {
  add,
  getAll,
  getAllTrending,
  getLatest,
  getOne,
  getRelatedItems,
  getTodayDeal,
  remove,
  update,
} from "../service/itemService.js";
import Item from "../model/itemsModel.js";
import {
  getOne as getCategory,
  getCategoryById,
} from "../service/categotyService.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import ItemAPIFeatures from "../utils/api/itemApiFeatures.js";
import ProductCount from '../model/productCountModel.js';
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CreateItem = async (req, res, next) => {
  const { error } = validateCreateItem.validate(req.body);

  if (error) {
    return next(new AppError(error.message, BADREQUEST));
  }

  let images = [];

  let data = req.body.subCategory.split("/");
  let BASE_URL = `${req.protocol}://${req.get("host")}`;

  if (req?.files?.length > 0) {
    req.files.forEach((file) => {
      let url = `${BASE_URL}/src/uploads/item/${req.body.itemTitle}/${file.originalname}`;
      images.push(url);
    });
  }

  const category = await getCategoryById(data[0]);

  if (!category) {
    return next(new AppError("Category not found", BADREQUEST));
  }

  if (category.subCategorys.length < 1) {
    return next(new AppError("Sub Category not found", BADREQUEST));
  }

  const subCategoryName = category.subCategorys.find(
    (subCategory) => subCategory._id.toString() === data[1]
  );

  let text =
    category.category.toLowerCase().trim().split(" ").join("-") +
    "/" +
    subCategoryName?.name.toLowerCase().trim().split(" ").join("-");

  req.body.subCategory = text;

  req.body.images = images;
  req.body.category = data[0];
  req.body.subCategoryId = data[1];

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentYear = new Date().getFullYear();
    const productCountDoc = await ProductCount.findOneAndUpdate(
      { year: currentYear },
      { $inc: { count: 1 } },
      { new: true, upsert: true, session }
    );

    const productCount = productCountDoc.count;
    req.body.productID = `${currentYear}-${String(productCount).padStart(4, "0")}`;

    const item = new Item(req.body);
    await item.save({ session });

    category.items.push(item);
    await category.save({ session });

    await session.commitTransaction();
    session.endSession();

    return next(new AppSuccess(item, "Item created successfully", SUCCESS));
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.log(err);
    return next(new AppError(err.message, BADREQUEST));
  }
};

export const updateItem = async (req, res, next) => {
  const { id } = req.params;

  if (_.isEmpty(id)) {
    return next(new AppError("Item id is required", 400));
  }

  const oldItem = await Item.findById(id);
  if (!oldItem) {
    return next(new AppError("Item not found", 404));
  }

  let images = [];

  // // If imagesCleared is false, keep the old images
  // if (req.body.imagesCleared === "false") {
  //   images = oldItem.images;
  // } else if (req.body.images && Array.isArray(req.body.images)) {
  //   // If the user has provided a list of remaining images
  //   images = req.body.images;
  // }

  if (typeof req?.body?.existingImages === "string") {
    images.push(req?.body?.existingImages);
  } else if (req?.body?.existingImages?.length > 0) {
    req?.body?.existingImages?.forEach((image) => {
      images.push(image);
    });
  }

  let BASE_URL = `${req.protocol}://${req.get("host")}`;

  // Add new images if there are any
  if (req?.files?.length > 0) {
    req.files.forEach((file) => {
      let url = `${BASE_URL}/src/uploads/item/${req.body.itemTitle}/${file.originalname}`;
      images.push(url);
    });
  }

  if (req.body.subCategory) {
    console.log(req.body.subCategory);
    let data = req.body.subCategory.split("/");
    if (data[0] !== oldItem.category.toString()) {
      // Remove item from old category's items

      const oldCategory = await getCategory(oldItem.category);

      console.log(oldItem.category, "oldItem.category");
      if (oldCategory) {
        oldCategory.items = oldCategory.items.filter(
          (item) => item.toString() !== id
        );
        await oldCategory.save();
      }

      // Add item to new category's items
      const newCategory = await getCategory(data[0]);

      if (!newCategory) {
        return next(new AppError("New category not found", 404));
      }
      newCategory.items.push(id);
      await newCategory.save();

      const subCategoryName = newCategory.subCategorys.find(
        (subCategory) => subCategory._id.toString() === data[1]
      );

      if (!subCategoryName) {
        return next(new AppError("Subcategory not found in new category", 404));
      }

      let text = `${newCategory.category
        .toLowerCase()
        .trim()
        .split(" ")
        .join("-")}/${subCategoryName.name
        .toLowerCase()
        .trim()
        .split(" ")
        .join("-")}`;
      req.body.subCategory = text;
      req.body.category = newCategory._id;
      req.body.subCategoryId = data[1];
    } else {
      const currentCategory = await getCategoryById(data[0]);

      console.log(data[0], "data[0]");

      console.log(currentCategory, "currentCategory");
      const subCategoryName = currentCategory?.subCategorys.find(
        (subCategory) => subCategory._id.toString() === data[1]
      );

      if (!subCategoryName) {
        return next(new AppError("Subcategory not found", 404));
      }

      let text = `${currentCategory.category
        .toLowerCase()
        .trim()
        .split(" ")
        .join("-")}/${subCategoryName.name
        .toLowerCase()
        .trim()
        .split(" ")
        .join("-")}`;
      req.body.subCategory = text;
      req.body.category = data[0];
      req.body.subCategoryId = data[1];
    }
  }

  req.body.images = images;

  const item = await Item.findByIdAndUpdate(id, req.body, { new: true });
  if (item) {
    return next(new AppSuccess(item, "Item Updated successfully", 200));
  } else {
    return next(new AppError("Something went wrong", 400));
  }
};

export const getItems = async (req, res, next) => {

  const resPerPage = 12;
  const currentPage = Number(req.query.page) || 1;

  // Extract category and subcategory from the query parameters
  const category = req.query.category;
  const subCategory = req.query.subCategory?.split(",");

  let filter = {};

  // If category is "all-products", no filter is applied
  if (category && category !== "all-products") {
    filter["subCategory"] = new RegExp(`^${category}/`);
  }

  // Add subCategory filter if subcategories are provided
  if (subCategory && subCategory.length > 0) {
    filter["subCategory"] = {
      $in: subCategory.map((sub) => new RegExp(`/${sub}$`)),
    };
  } else if (category && category !== "all-products") {
    filter["subCategory"] = new RegExp(`^${category}/`);
  }

  // Get the count of filtered items
  const itemsCount = await Item.countDocuments(filter);

  const startIndex = (currentPage - 1) * resPerPage;
  const endIndex = Math.min(startIndex + resPerPage, itemsCount);

  // Fetch items with the filter and pagination
  const items = await Item.find(filter).skip(startIndex).limit(resPerPage);

  if (items) {
    return next(
      new AppSuccess(
        {
          itemsCount: items.length,
          total: itemsCount,
          resPerPage: resPerPage,
          currentPage: currentPage,
          totalPages: Math.ceil(itemsCount / resPerPage),
          startIndex: startIndex + 1,
          endIndex: endIndex,
          items: items,
        },
        "Items successfully sent",
        SUCCESS
      )
    );
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

// export const getItems = async (req, res, next) => {
//   const resPerPage = 12;
//   const itemsCount = await Item.countDocuments();
//   const currentPage = Number(req.query.page) || 1;
//   const startIndex = (currentPage - 1) * resPerPage + 1;
//   const endIndex = Math.min(startIndex + resPerPage - 1, itemsCount);

//   const apiFeatures = new ItemAPIFeatures(Item.find(), req.query)
//     .search()
//     .paginate(resPerPage);

//   const getAll = async () => {
//     return await apiFeatures.query;
//   };

//   const items = await getAll();

//   if (items) {
//     return next(
//       new AppSuccess(
//         {
//           itemsCount: items.length,
//           total: itemsCount,
//           items: items,
//           startIndex: startIndex,
//           endIndex: endIndex
//         },
//         "Items successfully sent",
//         SUCCESS
//       )
//     );
//   } else {
//     return next(new AppError("Something went wrong", BADREQUEST));
//   }
// };

export const getSingleItem = async (req, res, next) => {
  try {
    const singleItem = await getOne(req.params.id);

    if (!singleItem) {
      return next(new AppError("Item not found", 404));
    }

    if (singleItem) {
      return next(new AppSuccess(singleItem, "Item send", SUCCESS));
    }
  } catch (error) {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const getItem = async (req, res, next) => {
  const { id } = req.params;
  if (_.isEmpty(id)) {
    return next(new AppError("Item id is required", BADREQUEST));
  }
  const item = await getOne(id);

  // console.log(item.subCategory);

  const relatedItems = await getRelatedItems(item.subCategory);

  if (item) {
    return next(
      new AppSuccess(
        {
          item,
          relatedItems,
        },
        "Item successfully Send",
        SUCCESS
      )
    );
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const deleteItem = async (req, res, next) => {
  const { id } = req.params;

  if (_.isEmpty(id)) {
    return next(new AppError("Item id is required", 400));
  }

  // Fetch the item to get the associated category
  const item = await getOne(id);
  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  // Remove the item reference from the category
  if (item.category) {
    const category = await getCategory(item.category);
    if (category) {
      category.items = category.items.filter(
        (itemId) => itemId.toString() !== id
      );
      await category.save();
    }
  }

  // Remove the images associated with the item
  if (item.images && item.images.length > 0) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const baseDir = path.resolve(
      __dirname,
      "..",
      "..",
      "src",
      "uploads",
      "item"
    ); // Adjust baseDir to your actual uploads folder

    // Get the folder path from the first image URL
    const firstImageUrl = item.images[0];
    const relativeFolderPath = firstImageUrl
      .replace(baseUrl, "")
      .split("/uploads/item/")[1]
      .split("/")[0];
    const folderPath = path.join(baseDir, relativeFolderPath);

    console.log(`Attempting to delete folder at path: ${folderPath}`); // Log the folder path

    try {
      fs.rmdirSync(folderPath, { recursive: true });
      console.log(`Successfully deleted folder: ${folderPath}`);
    } catch (err) {
      console.error(`Failed to delete folder: ${folderPath}`, err);
    }
  }

  // Remove the item
  const deletedItem = await remove(id);
  if (!deletedItem) {
    return next(new AppError("Something went wrong", 400));
  }

  return next(new AppSuccess(deletedItem, "Item Deleted successfully", 200));
  // return next(new AppSuccess(item, "Item Deleted successfully", 200));
};

// With Pagination

// export const getLatestItems = async (req, res, next) => {
//   const resPerPage = 12;
//   const currentPage = Number(req.query.page) || 1;
//   const itemsCount = await Item.countDocuments();

//   const skip = (currentPage - 1) * resPerPage;
//   const limit = resPerPage;

//   const startIndex = (currentPage - 1) * resPerPage;
//   const endIndex = Math.min(startIndex + resPerPage, itemsCount);

//   const items = await getLatest(limit, skip);

//   if (items) {
//     return next(
//       new AppSuccess(
//         {
//           itemsCount,
//           resPerPage,
//           currentPage,
//           totalPages: Math.ceil(itemsCount / resPerPage),
//           startIndex,
//           endIndex,
//           items,
//         },
//         "Items successfully sent",
//         SUCCESS
//       )
//     );
//   } else {
//     return next(new AppError("Something went wrong", BADREQUEST));
//   }
// };

export const getTrendingItems = async (req, res, next) => {
  const items = await getAllTrending();

  if (items) {
    return next(
      new AppSuccess(items, "Trending Items successfully Send", SUCCESS)
    );
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const getHomeDealItems = async (req, res, next) => {
  try {
    const todayDealsCount = await Item.find({
      isTrending: true,
    }).countDocuments();
    const liveForSaleCount = await Item.find({ isSale: true }).countDocuments();

    const todayDeals = await Item.find({ isTrending: true })
      .sort({ _id: -1 })
      .limit(4)
      .exec();
    const liveForSale = await Item.find({ isSale: true })
      .sort({ _id: -1 })
      .limit(8)
      .exec();
    const items = { todayDeals, liveForSale };

    if (items) {
      return next(
        new AppSuccess(
          { todayDealsCount, liveForSaleCount, items },
          "Home Deal Items successfully sent",
          SUCCESS
        )
      );
    } else {
      return next(new AppError("Something went wrong", BADREQUEST));
    }
  } catch (error) {
    return next(new AppError(error.message, BADREQUEST));
  }
};

export const getNewArrivals = async (req, res, next) => {
  // const items = await getLatest();
  const liveForSale = await Item.find({ isSale: true }).limit(12);

  //  Pagination

  if (liveForSale) {
    return next(
      new AppSuccess(
        {
          items: liveForSale.reverse(),
        },
        "Items successfully sent",
        SUCCESS
      )
    );
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const getTodayDealItems = async (req, res, next) => {
  const resPerPage = 12;
  const currentPage = Number(req.query.page) || 1;

  // Count only the trending items
  const itemsCount = await Item.countDocuments({ isTrending: true });

  const skip = (currentPage - 1) * resPerPage;
  const limit = resPerPage;

  const startIndex = (currentPage - 1) * resPerPage;
  const endIndex = Math.min(startIndex + resPerPage, itemsCount);

  const items = await getTodayDeal(limit, skip);

  if (items) {
    return next(
      new AppSuccess(
        {
          itemsCount,
          resPerPage,
          currentPage,
          totalPages: Math.ceil(itemsCount / resPerPage),
          startIndex,
          endIndex,
          items: items,
        },
        "Today Deals Items successfully sent",
        SUCCESS
      )
    );
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};
