const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      const data = {
        name: 'Test Product 2',
        category: 'Sarees',
        price: '1000',
        originalPrice: '', // EMPTY STRING
        stock: '10',
        description: 'Test',
        images: ['https://unsplash.com/123']
      };
      const product = await Product.create(data);
      console.log('Success:', product._id);
    } catch(e) {
      console.error('Error:', e.message);
    }
    process.exit(0);
  });
