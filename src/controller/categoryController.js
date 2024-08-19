import _ from "lodash";
import {
  add,
  createSub,
  getAll,
  getCategoryById,
  getOne,
  remove,
  removeSub,
  update,
  updateSub,
} from "../service/categotyService.js";
import AppSuccess from "../utils/response-handlers/app-success.js";
import {
  BADREQUEST,
  NOTFOUND,
  SUCCESS,
} from "../utils/constants/statusCode.js";
import AppError from "../utils/response-handlers/app-error.js";
import { validateCreateCategory } from "./../utils/validator/validateCategory.js";
import Item from "../model/itemsModel.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Category from "../model/categoryModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const CreateCategory = async (req, res, next) => {
  const { error } = validateCreateCategory.validate(req.body);

  if (error) {
    return next(new AppError("Something went wrong At Data", BADREQUEST));
  }

  let categoryName = req.body.title.toLowerCase().trim().split(" ").join("-");
  req.body.category = categoryName;
  let categoryData = req.body;

  const category = await add(categoryData);
  const categories = await getAll();

  if (category) {
    return next(
      new AppSuccess(category, "Category created successfully", SUCCESS)
    );
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  if (_.isEmpty(id)) {
    return next(new AppError("Category id is required", BADREQUEST));
  }

  let categoryName = req.body.title.toLowerCase().trim().split(" ").join("-");
  req.body.category = categoryName;
  const category = await update(id, req.body);

  if (category) {
    return next(
      new AppSuccess(category, "Category Updated successfully", SUCCESS)
    );
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const getCategories = async (req, res, next) => {
  const categories = await getAll();
  if (categories) {
    return next(
      new AppSuccess(categories, "Categories successfully Send", SUCCESS)
    );
  } else {
    return next(new AppError("No categories found", NOTFOUND));
  }
};

export const getTopCategory = async (req, res, next) => {
  try {
    const topCategory = [
      "kitchen-accessories",
      "flooring",
      "kitchen-clean",
      "bathroom-cleaning",
    ];

    const topCategories = await Promise.all(
      topCategory.map(async (item) => {
        // console.log(item);
        let data = await Category.findOne({ category: item }).populate("items");
        // console.log(data);
        return data;
      })
    );

    // Ensure we only take the first 8 items from each category
    topCategories.forEach((category) => {
      if (category && category.items) {
        category.items = category.items.slice(0, 8);
      }
    });

    if (topCategories.length > 0) {
      return next(
        new AppSuccess(
          topCategories,
          "Top Categories successfully sent",
          SUCCESS
        )
      );
    } else {
      return next(new AppError("No matching categories found", BADREQUEST));
    }
  } catch (error) {
    return next(new AppError(error.message, BADREQUEST));
  }
};

export const getCategory = async (req, res, next) => {
  const { id } = req.params;
  if (_.isEmpty(id)) {
    return next(new AppError("Category id is required", BADREQUEST));
  }
  let category;

  console.log(id,"id")

  if (id === "all-products") {


    category = await getOne(id);
  } else {
    category = await getCategoryById(id);
  }

  if (category) {
    return next(
      new AppSuccess(category, "Category successfully Send", SUCCESS)
    );
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const deleteCategory = async (req, res, next) => {
  const { id } = req.params;

  if (_.isEmpty(id)) {
    return next(new AppError("Category id is required", 400));
  }

  const category = await getCategoryById(id);
  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  // Delete all items under this category
  const items = await Item.find({ category: id });
  for (let item of items) {
    // Remove item images and folder
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

      // console.log(`Attempting to delete folder at path: ${folderPath}`); // Log the folder path

      try {
        fs.rmdirSync(folderPath, { recursive: true });
        // console.log(`Successfully deleted folder: ${folderPath}`);
      } catch (err) {
        console.error(`Failed to delete folder: ${folderPath}`, err);
      }
    }

    // Remove the item from the database
    await Item.findByIdAndDelete(item._id);
  }

  // Delete the category
  await remove(id);

  return next(
    new AppSuccess(category, "Category and its items deleted successfully", 200)
  );
};

export const getCategorieswithSearch = async (req, res, next) => {
  const categories = await getAll();

  const search = await getSearchinTotal(req);

  if (categories) {
    return next(
      new AppSuccess(categories, "Categories successfully Send", SUCCESS)
    );
  } else {
    return next(new AppError("No categories found", NOTFOUND));
  }
};

export const createSubCategory = async (req, res, next) => {
  const { categoryID } = req.params;
  const { name } = req.body;

  const category = await getCategoryById(categoryID);
  if (!category) {
    return next(new AppError("Category not found", NOTFOUND));
  }

  let alreadyExists = false;

  category.subCategorys.forEach((item) => {
    if (item.name === name) {
      alreadyExists = true;
      return next(new AppError("Sub Category already exists", BADREQUEST));
    }
  });

  if (!alreadyExists) {
    const updatedOne = await createSub(categoryID, name);

    if (updatedOne) {
      return next(
        new AppSuccess(updatedOne, "Sub Category created successfully", SUCCESS)
      );
    } else {
      return next(new AppError("Failed to create subcategory", BADREQUEST));
    }
  }
};

export const updateSubCategory = async (req, res, next) => {
  const { categoryID, subCategoryID } = req.params;
  const { name } = req.body;
  const updatedOne = await updateSub(categoryID, subCategoryID, name);

  if (updatedOne) {
    return next(
      new AppSuccess(
        updatedOne,
        "Sub Category Updated successfully Send",
        SUCCESS
      )
    );
  } else {
    return next(new AppError("No Sub category found", NOTFOUND));
  }
};

export const deleteSubCategory = async (req, res, next) => {
  const { categoryID, subCategoryID } = req.params;

  if (_.isEmpty(categoryID) || _.isEmpty(subCategoryID)) {
    return next(
      new AppError("Category ID and Subcategory ID are required", 400)
    );
  }

  const category = await getCategoryById(categoryID);
  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  const subCategoryIndex = category.subCategorys.findIndex(
    (sub) => sub._id.toString() === subCategoryID
  );
  if (subCategoryIndex === -1) {
    return next(
      new AppError("Subcategory not found in the specified category", 404)
    );
  }

  // Remove items associated with this subcategory
  const items = await Item.find({ subCategoryId: subCategoryID });

  for (let item of items) {
    // Remove item images and folder
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

      // console.log(`Attempting to delete folder at path: ${folderPath}`); // Log the folder path

      try {
        fs.rmdirSync(folderPath, { recursive: true });
        // console.log(`Successfully deleted folder: ${folderPath}`);
      } catch (err) {
        console.error(`Failed to delete folder: ${folderPath}`, err);
      }
    }

    // Remove the item from the database
    await Item.findByIdAndDelete(item._id);
  }

  // Remove the subcategory from the category

  const updatedOne = await removeSub(categoryID, subCategoryID);

  return next(
    new AppSuccess(
      updatedOne,
      "Subcategory and its items removed successfully",
      200
    )
  );
};
