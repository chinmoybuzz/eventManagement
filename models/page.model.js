const { model, Schema } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");
const { fileSchema } = require("./helperSchema");

const seoSchema = Schema({
  title: { type: String, default: null },
  description: { type: String, default: null },
});

const buttonSchema = Schema({
  buttonText: { type: String, default: null },
  buttonLink: { type: String, default: null },
  ordering: { type: Number, default: 0 },
});

const bannerSchema = Schema({
  title: { type: String, required: ["Title field is required"] },
  subtitle: { type: String, default: null },
  content: { type: String, default: null },
  button: { type: [buttonSchema], default: null },
  image: { type: fileSchema, default: null },
  ordering: { type: Number, default: 0 },
});

const cardSchema = Schema({
  icon: { type: String, default: null },
  name: { type: String, default: null },
  content: { type: String, default: null },
  link: { type: String, default: null },
  buttons: { type: [buttonSchema], default: null },
  ordering: { type: Number, default: 0 },
});

const sectionSchema = Schema({
  title: { type: String, default: null },
  description: { type: String, default: null },
  cards: { type: [cardSchema], default: null },
  ordering: { type: Number, default: 0 },
});

const pageSchema = Schema(
  {
    name: { type: String, default: null },
    description: { type: String, default: null },
    slug: { type: String, unique: true },
    seo: { type: seoSchema, default: null },
    image: { type: fileSchema, default: null },
    banner: { type: [bannerSchema], default: null },
    sections: { type: [sectionSchema], default: null },
    status: { type: Number, enum: [1, 2], default: 1 }, //1=> Active,2=>Inactive
    ordering: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

pageSchema.plugin(mongoosePaginate);
module.exports = model("pages", pageSchema);
