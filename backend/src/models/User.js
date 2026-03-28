import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ADMIN_ROLES } from "../config/runtime.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: ""
    },
    location: {
      type: String,
      trim: true,
      default: ""
    },
    preferredLanguage: {
      type: String,
      trim: true,
      default: "English"
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    avatarPath: {
      type: String,
      default: ""
    },
    adminRole: {
      type: String,
      enum: Object.values(ADMIN_ROLES),
      default: ADMIN_ROLES.USER
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ createdAt: -1 });
userSchema.index({ name: "text", email: "text" });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.matchPassword = function matchPassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
