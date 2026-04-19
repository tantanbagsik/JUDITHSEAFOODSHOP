import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  images: string[];
  videos: string[];
  categoryId?: mongoose.Types.ObjectId;
  tags: string[];
  inventory: number;
  isActive: boolean;
  isFeatured: boolean;
  variants: {
    name: string;
    options: {
      name: string;
      price: number;
      inventory: number;
    }[];
  }[];
  attributes: Record<string, string>;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  vendorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    sku: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: 0,
    },
    comparePrice: {
      type: Number,
      min: 0,
    },
    cost: {
      type: Number,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    tags: {
      type: [String],
      default: [],
    },
    inventory: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    variants: {
      type: [
        {
          name: String,
          options: [
            {
              name: String,
              price: Number,
              inventory: Number,
            },
          ],
        },
      ],
      default: [],
    },
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ storeId: 1 });
ProductSchema.index({ storeId: 1, isActive: 1 });
ProductSchema.index({ storeId: 1, categoryId: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
