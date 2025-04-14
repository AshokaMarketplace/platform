const express = require('express');
const router = express.Router();

// Store orders in memory (in a real app, this would be in a database)
const orders = new Map();

// Process payment and create order
router.post('/process-payment', (req, res) => {
    const {
        fullName,
        email,
        phone,
        streetAddress,
        productId,
        productName,
        productPrice,
        quantity,
        totalAmount
    } = req.body;

    const orderId = 'ORD' + Date.now();
    console.log('\n=== Processing New Order ===');
    console.log('Creating order with ID:', orderId);

    // Store order details
    const orderData = {
        id: orderId,
        customerName: fullName,
        email,
        phone,
        address: streetAddress,
        productDetails: {
            id: productId,
            name: productName,
            price: Number(productPrice),
            quantity: Number(quantity)
        },
        amount: Number(totalAmount),
        status: 'pending',
        createdAt: new Date()
    };

    // Save order to memory
    orders.set(orderId, orderData);
    console.log('Order saved to memory:', orders.has(orderId));
    console.log('Current order status:', orders.get(orderId).status);

    console.log('\n=== Order Details ===');
    console.log(`Order ID: ${orderId}`);
    console.log(`Customer: ${fullName}`);
    console.log(`Product: ${productName}`);
    console.log(`Amount: ₹${totalAmount}`);
    console.log('\nVendor Confirmation Links:');
    console.log(`View Order: http://localhost:3001/vendor/view/${orderId}`);
    console.log(`Quick Confirm: http://localhost:3001/vendor/quick-confirm/${orderId}`);
    console.log('============================\n');

    res.redirect(`/order-pending/${orderId}`);
});

// Order pending page
router.get('/order-pending/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    console.log('\n=== Accessing Order Pending Page ===');
    console.log('Looking for order:', orderId);

    const order = orders.get(orderId);
    console.log('Order found:', !!order);
    if (order) {
        console.log('Order status:', order.status);
    }

    if (!order) {
        console.log('Order not found in memory');
        return res.status(404).render('error', {
            message: 'Order not found',
            error: { status: 404 }
        });
    }

    res.render('order-pending', {
        orderId: order.id,
        amount: order.amount,
        productName: order.productDetails.name
    });
});

// API endpoint to check order status
router.get('/api/check-order-status/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    console.log('\n=== Checking Order Status ===');
    console.log('Looking for order:', orderId);

    const order = orders.get(orderId);
    console.log('Order found:', !!order);
    if (order) {
        console.log('Current status:', order.status);
    }

    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
        status: order.status,
        orderId: order.id,
        productName: order.productDetails.name,
        amount: order.amount
    });
});

// Vendor view order page
router.get('/vendor/view/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    console.log('\n=== Accessing Vendor View Page ===');
    console.log('Looking for order:', orderId);

    const order = orders.get(orderId);
    console.log('Order found:', !!order);
    if (order) {
        console.log('Current status:', order.status);
    }

    if (!order) {
        return res.render('error', {
            message: 'Order not found',
            error: { status: 404 }
        });
    }

    res.render('vendor-view', {
        orderId: order.id,
        customerName: order.customerName,
        productName: order.productDetails.name,
        amount: order.amount,
        status: order.status
    });
});

// Quick confirm order (simple GET request)
router.get('/vendor/quick-confirm/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    console.log('\n=== Processing Quick Confirmation ===');
    console.log('Looking for order:', orderId);

    const order = orders.get(orderId);
    console.log('Order found:', !!order);
    if (order) {
        console.log('Previous status:', order.status);
    }

    if (!order) {
        return res.render('error', {
            message: 'Order not found',
            error: { status: 404 }
        });
    }

    // Update order status
    order.status = 'confirmed';
    orders.set(orderId, order);
    console.log('Updated status to:', order.status);
    console.log('Order confirmation successful');

    // Render a simple success page
    res.render('quick-confirm-success', {
        orderId: order.id,
        customerName: order.customerName,
        productName: order.productDetails.name,
        amount: order.amount
    });
});

// Order confirmed page
router.get('/order-confirmed/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    console.log('\n=== Accessing Order Confirmed Page ===');
    console.log('Looking for order:', orderId);

    const order = orders.get(orderId);
    console.log('Order found:', !!order);
    if (order) {
        console.log('Current status:', order.status);
    }

    if (!order) {
        return res.status(404).render('error', {
            message: 'Order not found',
            error: { status: 404 }
        });
    }

    res.render('order-confirmed', {
        orderId: order.id,
        customerName: order.customerName,
        productName: order.productDetails.name,
        amount: order.amount
    });
});

module.exports = router; 