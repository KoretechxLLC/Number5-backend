const createError = require("http-errors");
const ShopModel = require("../Models/shop.model");
const path = require("path");
const fs = require("fs");

const ShopController = {
  add_item: async (req, res, next) => {
    let filename = req.file?.filename;

    try {
      let { item_name, item_description, item_sizes } = req.body;

      if (!item_name) throw createError.BadRequest("Item name is missing");

      if (item_sizes) {
        item_sizes = JSON.parse(item_sizes);
      }

      if (!item_sizes || item_sizes.length == 0)
        throw createError.BadRequest("Invalid Item Sizes");

      if (!filename) throw createError.BadRequest("Item picture is missing");

      let isItemExists = await ShopModel.findOne({ item_name: item_name });

      if (isItemExists) throw createError.BadRequest("Item already exists");

      let dataToSend = {
        ...req.body,
        item_sizes: item_sizes,
        item_pic: filename,
      };

      let shopItem = await ShopModel.create(dataToSend);

      if (!shopItem) throw createError.InternalServerError();

      res.status(200).json({
        message: "Shop items successfully added",
        data: shopItem,
      });
    } catch (err) {
      let filename = req.file?.filename;

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/shopItemImages/${filename}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }
      next(err);
    }
  },
  get_item: async (req, res, next) => {
    try {
      let shopItems = await ShopModel.find({});

      res.status(200).json({
        message: "Shop Items Successfully retreived",
        data: shopItems ? shopItems : [],
      });
    } catch (err) {
      next(err);
    }
  },
  delete: async (req, res, next) => {
    try {
      const id = req.params.id;

      console.log(id, "idddd");

      if (!id) {
        throw createError.BadRequest("Item ID is required");
      }

      const item = await ShopModel.findByIdAndDelete(id);

      if (!item) {
        throw createError.NotFound("Item not found");
      }

      if (item.item_pic) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/shopItemImages/${item.item_pic}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("Error deleting picture:", err);
          }
        });
      }

      res.status(200).json({
        message: "Item Successfully Deleted",
        data: item,
      });
    } catch (err) {
      next(err);
    }
  },
  update_item: async (req, res, next) => {
    let filename = req.file?.filename;

    try {
      let { item_name, item_description, item_sizes, id, item_pic } = req.body;

      if (!item_name || !id) throw createError.BadRequest("Required fields are missing");

      if (item_sizes) {
        item_sizes = JSON.parse(item_sizes);
      }

      console.log(id,"idddd")

      if (!id) throw createError.BadRequest("Item Id is missing");


      if (!item_sizes || item_sizes.length == 0)
        throw createError.BadRequest("Invalid Item Sizes");

      let itemExists = await ShopModel.findOne({_id : id.toString()});

      if (!itemExists) throw createError.NotFound("Item Not Found");

      let isitem_exists = await ShopModel.findOne({
        item_name: item_name,
        _id: { $ne: id.toString() },
      });

      if (isitem_exists)
        throw createError.BadRequest("Item name already exists");

      let dataToSend = {
        ...req.body,
        item_sizes: item_sizes,
        item_pic: filename ? filename : item_pic,
      };

      let shopItem = await ShopModel.findByIdAndUpdate(id, dataToSend, {
        new: true,
      });

      if (!shopItem) throw createError.InternalServerError();

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/shopItemImages/${item_pic}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      res.status(200).json({
        message: "Shop items successfully updated",
        data: shopItem,
      });
    } catch (err) {
      let filename = req.file?.filename;

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/shopItemImages/${filename}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }
      next(err);
    }
  },
};

module.exports = ShopController;
