const { Schema, model } = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");
const { ChatStatus, Status } = require("../helper/typeConfig");

const participantSchema = Schema({
  participantId: { type: ObjectId, default: null, ref: "users" },
  status: { type: String, enum: ChatStatus, default: ChatStatus[0] },
  statusDate: {
    requestedDate: { type: Date, default: null },
    acceptedDate: { type: Date, default: null },
    rejectedDate: { type: Date, default: null },
    leftDate: { type: Date, default: null },
  },
  isGroupOwner: { type: Boolean, default: false },
});

const chatSchema = Schema(
  {
    isGroup: { type: Boolean, default: false },
    name: { type: String, default: null },
    participants: { type: [participantSchema], default: [] },
    status: { type: Number, enum: Status, default: Status[0] }, //1=> Active, 2=>Inactive
    ordering: { type: Number, default: 0 },
    createdBy: { type: ObjectId, ref: "users", default: null },
    updatedBy: { type: ObjectId, ref: "users", default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);
chatSchema.plugin(mongoosePaginate);
module.exports = model("chats", chatSchema);
