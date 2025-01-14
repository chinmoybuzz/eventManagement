const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");

const countrySchema = Schema(
  {
    name: { type: String, default: null },
    iso3: { type: String, default: null },
    iso2: { type: String, default: null },
    numeric_code: { type: String, default: null },
    phone_code: { type: String, default: null },
    cities: { type: [String], default: null },
    capital: { type: String, default: null },
    currency: { type: String, default: null },
    currency_name: { type: String, default: null },
    currency_symbol: { type: String, default: null },
    tld: { type: String, default: null },
    native: { type: String, default: null },
    region: { type: String, default: null },
    subregion: { type: String, default: null },
    timezones: { type: Array, default: [] },
    translations: { type: Array, default: [] },
    latitude: { type: String, default: null },
    longitude: { type: String, default: null },
    emoji: { type: String, default: null },
    emojiU: { type: String, default: null },
    status: { type: Number, enum: [1, 2], default: 1 },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);
countrySchema.plugin(mongoosePaginate);

module.exports = model("countries", countrySchema);
