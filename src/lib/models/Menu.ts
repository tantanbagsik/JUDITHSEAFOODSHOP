import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IMenuItem {
  id: string;
  label: string;
  type: 'link' | 'category' | 'product' | 'external';
  url?: string;
  categoryId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  children?: IMenuItem[];
}

export interface IMenu extends Document {
  _id: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  items: IMenuItem[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['link', 'category', 'product', 'external'],
      default: 'link',
    },
    url: String,
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    children: [
      {
        id: String,
        label: String,
        type: String,
        url: String,
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      },
    ],
  },
  { _id: false }
);

const MenuSchema = new Schema<IMenu>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    items: {
      type: [MenuItemSchema],
      default: [],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

MenuSchema.index({ storeId: 1 });

const Menu: Model<IMenu> = mongoose.models.Menu || mongoose.model<IMenu>('Menu', MenuSchema);

export default Menu;
