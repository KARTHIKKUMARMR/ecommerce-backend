async function run() {
  try {
    // 1. login as admin
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@brandname.com', password: 'admin123' })
    });
    
    let loginData = await loginRes.json();
    if (!loginData.token) {
        console.error('Login failed', loginData);
        process.exit(1);
    }
    const token = loginData.token;

    // 2. Add product
    const productData = {
      name: 'API Test Product',
      category: 'Sarees',
      price: '1000',
      originalPrice: '2000',
      stock: '10',
      description: 'Test description via API',
      images: ['https://unsplash.com/123']
    };

    const addRes = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
    const addData = await addRes.json();
    console.log('Add Product Response:', addRes.status, addData);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
