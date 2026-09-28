import mongoose from "mongoose";

const checklistItemSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const labelSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    default: "#3b82f6", // default blue
  },
});

const attachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    labels: [labelSchema],
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    checklist: [checklistItemSchema],
    attachments: [attachmentSchema],
    isArchived: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

cardSchema.index({ list: 1, position: 1, isDeleted: 1 });
cardSchema.index({ board: 1, isDeleted: 1, isArchived: 1 });
cardSchema.index({ project: 1, isDeleted: 1 });
cardSchema.index({ organization: 1, isDeleted: 1 });

const Card = mongoose.model("Card", cardSchema);
export default Card;
