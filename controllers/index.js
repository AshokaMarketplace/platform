const { products, founders, vendors } = require('../data');
const fs = require('fs');

let orders = require('../orders.json'); // Path relative to controllers directory
exports.getHome = (req, res) => {
	res.render('home', { products });
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
	res.render('products', { products: filteredProducts });
};

exports.getProduct = (req, res) => {
	const productId = parseInt(req.params.id);
	const product = products.find(p => p.id === productId);
	console.log('Rendering product:', product); // Debug log
	if (!product) {
		return res.status(404).send('Product not found');
	}
	const relatedProducts = products.filter(p => p.id !== productId).slice(0, 4);
	res.render('product', { product, relatedProducts, founders }); // Pass founders
};

exports.getPayment = (req, res) => {
	const productId = parseInt(req.params.id);
	const quantity = parseInt(req.query.quantity) || 1;
	const product = products.find(p => p.id === productId);
	if (!product) {
		return res.status(404).send('Product not found');
	}
	const orderId = Date.now(); // Unique order ID based on timestamp
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
	fs.writeFileSync('./orders.json', JSON.stringify(orders, null, 2)); // Write to root directory
	console.log(`New order created with ID: ${orderId}`); // Add this log
	res.render('payment', { product, quantity });
};

exports.postPaymentConfirm = (req, res) => {
	const { productId, quantity, name: buyerName } = req.body;
	const product = products.find(p => p.id === parseInt(productId));
	if (!product) {
		return res.status(404).send('Product not found');
	}
	const order = orders.orders.find(o => o.productId === parseInt(productId) && o.status === 'Pending Payment');
	if (order) {
		order.buyerName = buyerName;
		order.status = 'Payment Initiated';
		fs.writeFileSync('./orders.json', JSON.stringify(orders, null, 2));
	}
	res.redirect(`/payment/${productId}?quantity=${quantity}`);
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
	res.render('about');
};

exports.getStories = (req, res) => {
	res.render('stories', { founders });
};

exports.getAccount = (req, res) => {
	res.render('account');
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


