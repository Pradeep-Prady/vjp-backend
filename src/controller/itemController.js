import _ from "lodash";
import AppSuccess from "../utils/response-handlers/app-success.js";
import { BADREQUEST, SUCCESS } from "../utils/constants/statusCode.js";
import AppError from "../utils/response-handlers/app-error.js";
import { validateCreateItem } from "../utils/validator/validateItem.js";
import { add, getAll, getLatest, getOne, remove, update } from "../service/itemService.js";
import Item from "../model/itemsModel.js";
import { getOne as getCategory } from "../service/categotyService.js";
import APIFeatures from "../utils/api/apiFeatures.js";

export const CreateItem = async (req, res, next) => {
  let images = [];

  const { error } = validateCreateItem.validate(req.body);

  if (error) {
    return next(new AppError(error.message, BADREQUEST));
  }

  let data = req.body.subCategory.split("/");
  let BASE_URL = `${req.protocol}://${req.get("host")}`;

  if (req?.files?.length > 0) {
    req.files.forEach((file) => {
      let url = `${BASE_URL}/src/uploads/item/${req.body.itemTitle}/${file.originalname}`;
      images.push(url);
    });
  }

  const category = await getCategory(data[0]);

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

  // item.save

  let itemData = req.body;
  const item = await add(itemData);

  category?.items?.push(item);
  await category?.save();

  if (item) {
    return next(new AppSuccess(item, "Item created successfully", SUCCESS));
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
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
    let data = req.body.subCategory.split("/");
    if (data[0] !== oldItem.category.toString()) {
      // Remove item from old category's items

      const oldCategory = await getCategory(oldItem.category);
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
      const currentCategory = await getCategory(data[0]);
      const subCategoryName = currentCategory.subCategorys.find(
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
  const items = await getAll();

  if (items) {
    return next(
      new AppSuccess(
        { itemsCount: items.length, items: items },
        "Items successfully Send",
        SUCCESS
      )
    );
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const getItem = async (req, res, next) => {
  const { id } = req.params;
  if (_.isEmpty(id)) {
    return next(new AppError("Item id is required", BADREQUEST));
  }
  const item = await getOne(id);

  if (item) {
    return next(new AppSuccess(item, "Item successfully Send", SUCCESS));
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

  // Remove the item
  const deletedItem = await remove(id);
  if (!deletedItem) {
    return next(new AppError("Something went wrong", 400));
  }

  return next(new AppSuccess(deletedItem, "Item Deleted successfully", 200));
};

export const getLatestItems = async (req, res, next) => {
  const items = await getLatest();
  if (items) {
    return next(new AppSuccess(items, "Items successfully Send", SUCCESS));
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};
