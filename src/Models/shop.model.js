const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  item_name: {
    type: String,
    required: true,
    unique : true
  },
  item_description : {
    type : String,
  },
  item_sizes: {
    type: [],
  },
  item_pic: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const ShopModel = mongoose.model("Shop", shopSchema);

module.exports = ShopModel;
