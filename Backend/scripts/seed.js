require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Product = require("../models/Product");
const User = require("../models/User");

const PRODUCTS = [
  { name: "Arc Desk Lamp", category: "Lighting", price: 129, stock: 14, emoji: "💡", description: "Minimal arc lamp with warm LED. Dimmable, USB-C charging base.", rating: 4.8, numReviews: 312, isFeatured: true, tags: ["lamp", "desk", "lighting"] },
  { name: "Wool Throw Blanket", category: "Textiles", price: 89, stock: 28, emoji: "🧶", description: "100% merino wool. Machine washable. Available in 6 earth tones.", rating: 4.6, numReviews: 204, tags: ["blanket", "wool", "bedroom"] },
  { name: "Ceramic Pour-Over Set", category: "Kitchen", price: 64, stock: 9, emoji: "☕", description: "Handthrown ceramic dripper + carafe. Holds 600ml.", rating: 4.9, numReviews: 541, isFeatured: true, tags: ["coffee", "ceramic", "kitchen"] },
  { name: "Linen Desk Pad", category: "Office", price: 45, stock: 33, emoji: "🗒️", description: "Natural linen surface, cork backing. 80×40cm.", rating: 4.5, numReviews: 178, tags: ["desk", "office", "linen"] },
  { name: "Brass Bookends", category: "Decor", price: 78, stock: 17, emoji: "📚", description: "Solid brass, hand-finished. Sold as pair. 1.2kg each.", rating: 4.7, numReviews: 95, tags: ["brass", "books", "decor"] },
  { name: "Walnut Tray", category: "Decor", price: 55, stock: 22, emoji: "🪵", description: "American black walnut. Food safe oil finish. 30×20cm.", rating: 4.8, numReviews: 267, isFeatured: true, tags: ["walnut", "tray", "wood"] },
  { name: "Canvas Tote Bag", category: "Accessories", price: 38, stock: 60, emoji: "👜", description: "12oz natural canvas. Reinforced handles. 15L capacity.", rating: 4.4, numReviews: 420, tags: ["bag", "tote", "canvas"] },
  { name: "Steel Water Bottle", category: "Kitchen", price: 42, stock: 45, emoji: "🥤", description: "18/8 stainless steel, double-wall vacuum. 500ml. Leak-proof lid.", rating: 4.9, numReviews: 889, isFeatured: true, tags: ["bottle", "water", "steel"] },
  { name: "Bamboo Planter", category: "Decor", price: 32, stock: 8, emoji: "🌿", description: "Sustainably sourced bamboo. Drainage hole included. 15cm diameter.", rating: 4.3, numReviews: 132, tags: ["planter", "bamboo", "plant"] },
  { name: "Cork Coasters Set of 6", category: "Kitchen", price: 24, stock: 55, emoji: "🪨", description: "Natural cork, laser-engraved geometric pattern. 10cm diameter.", rating: 4.6, numReviews: 371, tags: ["cork", "coasters", "kitchen"] },
  { name: "Linen Pillowcase Pair", category: "Textiles", price: 58, stock: 19, emoji: "🛏️", description: "100% stonewashed linen. Standard & king size. Envelope closure.", rating: 4.7, numReviews: 193, tags: ["pillow", "linen", "bedroom"] },
  { name: "Wooden Pen Holder", category: "Office", price: 29, stock: 41, emoji: "✏️", description: "Turned oak. Holds 8–10 pens. Felt-lined base.", rating: 4.5, numReviews: 86, tags: ["pen", "desk", "oak", "office"] },
];

const USERS = [
  { name: "Admin User", email: "admin@formastore.com", password: "admin123", role: "admin" },
  { name: "Jane Smith", email: "jane@example.com", password: "password123", role: "user" },
  { name: "Bob Johnson", email: "bob@example.com", password: "password123", role: "user" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/forma_store");
  console.log("✅ Connected to MongoDB");

  // Clear
  await Promise.all([Product.deleteMany(), User.deleteMany()]);
  console.log("🗑️  Cleared existing data");

  // Seed products
  await Product.insertMany(PRODUCTS);
  console.log(`✅ Seeded ${PRODUCTS.length} products`);

  // Seed users (hash passwords)
  for (const u of USERS) {
    await User.create(u); // pre-save hook hashes password
  }
  console.log(`✅ Seeded ${USERS.length} users`);

  console.log("\n🎉 Database seeded successfully!");
  console.log("─────────────────────────────────");
  console.log("Admin login:  admin@formastore.com / admin123");
  console.log("User login:   jane@example.com / password123");
  console.log("─────────────────────────────────\n");

  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });