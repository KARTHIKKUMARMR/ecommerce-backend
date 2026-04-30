require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

const products = [
  {
    name: 'Royal Banarasi Silk Saree',
    description: 'Exquisite Banarasi silk saree with intricate gold zari work, featuring traditional temple border designs. Perfect for weddings and festive occasions.',
    price: 4999, originalPrice: 7999, category: 'Sarees',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'],
    sizes: [{ size: 'Free Size', stock: 15 }], 
    colors: ['Maroon', 'Gold', 'Green'],
    stock: 15, isFeatured: true, isOnSale: true, discount: 37,
    tags: ['banarasi', 'silk', 'wedding', 'traditional'], ratings: 4.8, numReviews: 24,
  },
  {
    name: 'Kanjivaram Silk Saree',
    description: 'Pure Kanjivaram silk with rich temple motifs and contrast borders. A timeless classic that embodies South Indian heritage.',
    price: 6499, originalPrice: 9999, category: 'Sarees',
    images: ['https://images.unsplash.com/photo-1583391733981-8498408ee4b6?w=600'],
    sizes: [{ size: 'Free Size', stock: 10 }], 
    colors: ['Purple', 'Gold', 'Red'],
    stock: 10, isFeatured: true, isOnSale: true, discount: 35,
    tags: ['kanjivaram', 'silk', 'south indian', 'heritage'], ratings: 4.9, numReviews: 18,
  },
  {
    name: 'Chanderi Printed Saree',
    description: 'Light and elegant Chanderi fabric saree with beautiful floral prints and golden border. Perfect for casual and semi-formal occasions.',
    price: 1899, originalPrice: 2999, category: 'Sarees',
    images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600'],
    sizes: [{ size: 'Free Size', stock: 30 }], 
    colors: ['Peach', 'Blue', 'Yellow'],
    stock: 30, isFeatured: false, isOnSale: true, discount: 36,
    tags: ['chanderi', 'floral', 'casual'], ratings: 4.3, numReviews: 12,
  },
  {
    name: 'Anarkali Floral Kurti',
    description: 'Stunning Anarkali style kurti with intricate floral embroidery and flared hemline. Made from premium cotton blend fabric.',
    price: 1299, originalPrice: 1999, category: 'Kurtis',
    images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600'],
    sizes: [
      { size: 'XS', stock: 5 },
      { size: 'S', stock: 10 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 10 },
      { size: 'XL', stock: 5 },
      { size: 'XXL', stock: 5 }
    ], 
    colors: ['Pink', 'Blue', 'Green'],
    stock: 50, isFeatured: true, isOnSale: true, discount: 35,
    tags: ['anarkali', 'embroidery', 'floral', 'cotton'], ratings: 4.6, numReviews: 31,
  },
  {
    name: 'Mirror Work Kurti',
    description: 'Vibrant Rajasthani-inspired kurti with beautiful mirror work embroidery and block prints. A true celebration of Indian craft.',
    price: 999, originalPrice: 1499, category: 'Kurtis',
    images: ['https://images.unsplash.com/photo-1576185850227-1f72b7f8d483?w=600'],
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 10 },
      { size: 'XL', stock: 5 },
      { size: 'XXL', stock: 5 }
    ], 
    colors: ['Orange', 'Pink', 'Yellow'],
    stock: 40, isFeatured: true, isOnSale: false, discount: 0,
    tags: ['mirror work', 'rajasthani', 'block print'], ratings: 4.4, numReviews: 22,
  },
  {
    name: 'Cotton Straight Kurti',
    description: 'Comfortable everyday cotton kurti with geometric prints and side slits. Perfect for daily wear and casual outings.',
    price: 699, originalPrice: 999, category: 'Kurtis',
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600'],
    sizes: [
      { size: 'XS', stock: 10 },
      { size: 'S', stock: 15 },
      { size: 'M', stock: 20 },
      { size: 'L', stock: 10 },
      { size: 'XL', stock: 5 }
    ], 
    colors: ['White', 'Blue', 'Green'],
    stock: 60, isFeatured: false, isOnSale: true, discount: 30,
    tags: ['cotton', 'geometric', 'daily wear'], ratings: 4.1, numReviews: 45,
  },
  {
    name: 'Kundan Temple Earrings',
    description: 'Handcrafted kundan earrings with meenakari work and dangling pearl beads. Inspired by ancient temple jewellery traditions.',
    price: 799, originalPrice: 1299, category: 'Earrings',
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600'],
    sizes: [{ size: 'Free Size', stock: 25 }], 
    colors: ['Gold', 'Red'],
    stock: 25, isFeatured: true, isOnSale: true, discount: 38,
    tags: ['kundan', 'meenakari', 'temple', 'traditional'], ratings: 4.7, numReviews: 19,
  },
  {
    name: 'Jhumka Chandelier Earrings',
    description: 'Classic jhumka design with oxidised silver finish and intricate floral patterns. A staple in every Indian woman\'s jewellery collection.',
    price: 499, originalPrice: 799, category: 'Earrings',
    images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600'],
    sizes: [{ size: 'Free Size', stock: 35 }], 
    colors: ['Silver', 'Antique Gold'],
    stock: 35, isFeatured: true, isOnSale: false, discount: 0,
    tags: ['jhumka', 'oxidised', 'silver', 'classic'], ratings: 4.5, numReviews: 28,
  },
  {
    name: 'Pearl Drop Earrings',
    description: 'Elegant pearl drop earrings set in gold-toned brass. Perfect for both traditional and fusion outfits.',
    price: 349, originalPrice: 599, category: 'Earrings',
    images: ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600'],
    sizes: [{ size: 'Free Size', stock: 45 }], 
    colors: ['White Pearl', 'Gold'],
    stock: 45, isFeatured: false, isOnSale: true, discount: 41,
    tags: ['pearl', 'elegant', 'fusion'], ratings: 4.2, numReviews: 16,
  },
  {
    name: 'Lac Bangle Set (Set of 12)',
    description: 'Traditional hand-painted lac bangles with mirror and thread work. Each set is unique and crafted by skilled artisans from Rajasthan.',
    price: 599, originalPrice: 899, category: 'Bangles',
    images: ['https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600'],
    sizes: [
      { size: '2.2', stock: 5 },
      { size: '2.4', stock: 10 },
      { size: '2.6', stock: 10 },
      { size: '2.8', stock: 5 }
    ], 
    colors: ['Red', 'Green', 'Blue', 'Yellow'],
    stock: 30, isFeatured: true, isOnSale: true, discount: 33,
    tags: ['lac', 'rajasthani', 'traditional', 'handcrafted'], ratings: 4.6, numReviews: 38,
  },
  {
    name: 'Gold-Plated Bangles (Set of 6)',
    description: 'Elegant gold-plated bangles with intricate filigree work. Lightweight yet stunning, perfect for weddings and festive wear.',
    price: 899, originalPrice: 1499, category: 'Bangles',
    images: ['https://images.unsplash.com/photo-1573408301185-9519f94815b3?w=600'],
    sizes: [
      { size: '2.2', stock: 5 },
      { size: '2.4', stock: 5 },
      { size: '2.6', stock: 5 },
      { size: '2.8', stock: 5 }
    ], 
    colors: ['Gold'],
    stock: 20, isFeatured: true, isOnSale: false, discount: 0,
    tags: ['gold plated', 'filigree', 'wedding', 'festive'], ratings: 4.8, numReviews: 21,
  },
  {
    name: 'Meenakari Bangle Set (Set of 4)',
    description: 'Vibrant meenakari work bangles with floral patterns in traditional colors. A burst of color and craftsmanship for your wrists.',
    price: 449, originalPrice: 699, category: 'Bangles',
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600'],
    sizes: [
      { size: '2.2', stock: 10 },
      { size: '2.4', stock: 10 },
      { size: '2.6', stock: 10 },
      { size: '2.8', stock: 10 }
    ], 
    colors: ['Multicolor'],
    stock: 40, isFeatured: false, isOnSale: true, discount: 35,
    tags: ['meenakari', 'floral', 'colorful'], ratings: 4.3, numReviews: 14,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    // Keep users to avoid resetting passwords/tokens unless necessary
    // await User.deleteMany({});
    console.log('Cleared existing products');

    // Seed products one by one to trigger 'save' middleware (total stock calc)
    for (const p of products) {
      await Product.create(p);
    }
    
    console.log(`✅ Seeded ${products.length} products`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
