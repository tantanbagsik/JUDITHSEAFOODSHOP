import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  quantity: { type: Number, required: true, min: 1, default: 1 },
  inventory: { type: Number, default: 0 },
  storeId: { type: String, required: true },
  storeName: { type: String, default: '' },
  storeSlug: { type: String, default: '' },
}, { _id: true });

const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  storeCarts: [{
    storeId: { type: String, required: true },
    storeName: { type: String, default: '' },
    storeSlug: { type: String, default: '' },
    items: [CartItemSchema],
    updatedAt: { type: Number, default: Date.now },
  }],
  updatedAt: { type: Number, default: Date.now },
}, { timestamps: true });

CartSchema.index({ userId: 1, 'storeCarts.storeId': 1 });

export default mongoose.models.Cart || mongoose.model('Cart', CartSchema);
