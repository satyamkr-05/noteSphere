import mongoose from "mongoose";

const downloadRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true
    }
  },
  {
    timestamps: true
  }
);

downloadRecordSchema.index({ user: 1, createdAt: -1 });
downloadRecordSchema.index({ user: 1, note: 1 });
downloadRecordSchema.index({ note: 1, createdAt: -1 });

const DownloadRecord = mongoose.model("DownloadRecord", downloadRecordSchema);
export default DownloadRecord;
