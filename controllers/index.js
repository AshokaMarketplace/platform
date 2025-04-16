const { products } = require('../data');
const founders = require('../data/founders');
const fs = require('fs');

let orders = require('../orders.json'); // Path relative to controllers directory
exports.getHome = (req, res) => {
	res.render('home', { products, path: '/' });
};

exports.getProducts = (req, res) => {
	const { q, sort } = req.query;
	let filteredProducts = q ? products.filter(p => p.name.toLowerCase().includes(q.toLowerCase())) : products;
	if (sort) {
		switch (sort) {
			case 'low-to-high':
				filteredProducts.sort((a, b) => a.price - b.price);
				break;
			case 'high-to-low':
				filteredProducts.sort((a, b) => b.price - a.price);
				break;
			case 'popularity':
				filteredProducts.sort((a, b) => b.popularity - a.popularity); // Assuming popularity field
				break;
			case 'newly-added':
				filteredProducts.sort((a, b) => b.id - a.id); // Assuming ID indicates recency
				break;
		}
	}
	const categories = ['Electronics', 'Fashion', 'Books', 'Accessories'];
	res.render('products', {
		products: filteredProducts,
		categories,
		path: '/products'
	});
};

exports.getProduct = (req, res) => {
	try {
		const productId = req.params.id;

		// First try to find by ID (both string and numeric)
		let product = products.find(p => p.id === productId);

		// If not found by ID, try to find by name (URL-friendly version)
		if (!product) {
			const nameFromUrl = productId.replace(/-/g, ' ');
			product = products.find(p =>
				p.name.toLowerCase() === nameFromUrl.toLowerCase() ||
				p.name.toLowerCase().replace(/\s+/g, '-') === productId.toLowerCase()
			);
		}

		if (!product) {
			return res.status(404).render('error', {
				message: 'Product not found',
				error: { status: 404 }
			});
		}

		// Get related products (excluding current product)
		const relatedProducts = products.filter(p => p.id !== product.id).slice(0, 4);

		// Get founder information
		const founder = founders.find(f => f.id === product.founderId);

		res.render('product', {
			product,
			relatedProducts,
			founder: founder || null // Handle case where founder is not found
		});
	} catch (error) {
		console.error('Error in getProduct:', error);
		res.status(500).render('error', {
			message: 'Error loading product',
			error: { status: 500 }
		});
	}
};

exports.getPayment = (req, res) => {
	const productId = req.params.id;
	const quantity = parseInt(req.query.quantity) || 1;

	console.log('Looking for product with ID:', productId); // Debug log

	// First try to find by ID (both string and numeric)
	let product = products.find(p => p.id === productId || p.id === `product${productId}` || p.id === parseInt(productId));

	// If not found by ID, try to find by name (URL-friendly version)
	if (!product) {
		const nameFromUrl = productId.replace(/-/g, ' ');
		product = products.find(p =>
			p.name.toLowerCase() === nameFromUrl.toLowerCase() ||
			p.name.toLowerCase().replace(/\s+/g, '-') === productId.toLowerCase()
		);
	}

	if (!product) {
		console.log('Product not found. Available products:', products.map(p => ({ id: p.id, name: p.name }))); // Debug log
		return res.status(404).render('error', {
			message: 'Product not found',
			error: { status: 404 }
		});
	}

	const orderId = Date.now().toString(); // Unique order ID based on timestamp
	const order = {
		id: orderId,
		productId: product.id,
		productName: product.name,
		vendorId: product.vendorId,
		buyerName: '',
		quantity: quantity,
		total: product.price * quantity,
		status: 'Pending Payment',
		paymentUpi: product.upiId,
		confirmed: false,
		timestamp: new Date().toISOString()
	};

	orders.orders.push(order);
	fs.writeFileSync('./orders.json', JSON.stringify(orders, null, 2));
	console.log(`New order created with ID: ${orderId}`);

	res.render('payment', {
		product,
		quantity,
		orderId,
		total: product.price * quantity
	});
};

exports.postPaymentConfirm = (req, res) => {
	const productId = req.params.id;
	const { name, email, phone, address, city, pincode, quantity, orderId } = req.body;

	// Find the order
	const order = orders.orders.find(o => o.id === orderId);
	if (!order) {
		return res.status(404).render('error', {
			message: 'Order not found',
			error: { status: 404 }
		});
	}

	// Update order with customer details
	order.buyerName = name;
	order.email = email;
	order.phone = phone;
	order.address = {
		street: address,
		city: city,
		pincode: pincode
	};
	order.status = 'Payment Initiated';

	// Save updated order
	fs.writeFileSync('./orders.json', JSON.stringify(orders, null, 2));

	// Redirect to order confirmation page
	res.redirect(`/order-confirmation/${orderId}`);
};

exports.getOrderConfirmation = (req, res) => {
	const orderId = req.params.orderId;
	const order = orders.orders.find(o => o.id === orderId);

	if (!order) {
		return res.status(404).render('error', {
			message: 'Order not found',
			error: { status: 404 }
		});
	}

	const product = products.find(p => p.id === order.productId);

	res.render('order-confirmation', {
		order,
		product,
		quantity: order.quantity,
		total: order.total
	});
};

exports.getVendorConfirm = (req, res) => {
	const orderId = parseInt(req.params.orderId);
	const order = orders.orders.find(o => o.id === orderId);
	if (!order || order.confirmed) {
		return res.status(400).send('Invalid or already confirmed order');
	}
	order.status = 'Confirmed';
	order.confirmed = true;
	fs.writeFileSync('./orders.json', JSON.stringify(orders, null, 2));
	console.log(`Order ${orderId} confirmed. Notify buyer: ${order.buyerName}`);
	res.send('Payment confirmed. Please coordinate delivery with the buyer.');
};

exports.postOrderConfirmation = (req, res) => {
	const productId = parseInt(req.body.productId);
	const quantity = parseInt(req.body.quantity);
	const product = products.find(p => p.id === productId);
	if (!product) {
		return res.status(404).send('Product not found');
	}
	const order = orders.orders.find(o => o.productId === productId && o.quantity === quantity && o.confirmed);
	if (!order) {
		return res.status(400).send('Payment not confirmed by vendor');
	}
	res.render('order-confirmation', { product, quantity });
};

exports.getIndex = (req, res) => {
	console.log('Products for homepage:', products);
	res.render('home', { products });
};

exports.getSeller = (req, res) => {
	res.render('seller');
};

exports.getDashboard = (req, res) => {
	res.render('dashboard');
};

exports.getAbout = (req, res) => {
	res.render('about', { path: '/about' });
};

exports.getStories = (req, res) => {
	res.render('stories', { founders, path: '/stories' });
};

exports.getAccount = (req, res) => {
	res.render('account', { path: '/account' });
};

exports.postSeller = (req, res) => {
	// Placeholder: Handle form data (e.g., log or save to database)
	console.log('Seller form submitted:', req.body);
	res.send('<p class="text-green-600">Seller registration submitted!</p>');
};

exports.getSellerRegister = (req, res) => {
	res.render('seller');
};
exports.postSellerRegister = (req, res) => {
	const { name, email, upiId } = req.body;
	const qrCodeFile = req.files ? req.files['qrCode']?.[0] : null;
	const productImageFiles = req.files ? req.files['productImages'] || [] : [];

	// Server-side validation
	if (!name || !email || !upiId) {
		return res.status(400).render('seller', { error: 'All fields (name, email, UPI ID) are required.' });
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return res.status(400).render('seller', { error: 'Invalid email format.' });
	}

	const upiRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$/;
	if (!upiRegex.test(upiId)) {
		return res.status(400).render('seller', { error: 'Invalid UPI ID format. Use username@bank (e.g., yourname@oksbi).' });
	}

	const existingVendor = vendors.find(v => v.email === email);
	if (existingVendor) {
		return res.status(400).render('seller', { error: 'A vendor with this email already exists.' });
	}

	const newVendor = {
		id: vendors.length + 1,
		name,
		email,
		upiId,
		qrCodePath: qrCodeFile ? `/images/${qrCodeFile.filename}` : '/images/upi-qr-placeholder.jpg',
		productImagePaths: productImageFiles.map(file => `/images/${file.filename}`)
	};
	vendors.push(newVendor);
	const data = require('../data');
	data.vendors = vendors;
	fs.writeFileSync('./data.js', `module.exports = ${JSON.stringify(data, null, 2)};`);
	res.redirect('/seller/register?success=true');
};


