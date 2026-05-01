import mongoose, { Schema, Model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
  name: string;
  role: 'superadmin' | 'admin' | 'vendor' | 'customer';
  storeId?: mongoose.Types.ObjectId;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  emailVerified: Date | null;
  authProvider?: 'credentials' | 'google' | 'facebook';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'vendor', 'customer'],
      default: 'customer',
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
    avatar: String,
    phone: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['credentials', 'google', 'facebook'],
      default: 'credentials',
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre('save', async function () {
  if (!this.isNew || !this.password) return;
  if (this.authProvider !== 'credentials') return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
