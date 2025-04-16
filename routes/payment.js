const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Helper function to read orders
async function getOrders() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/orders.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading orders:', error);
        return { orders: [] };
    }
}

// Helper function to write orders
async function saveOrders(orders) {
    try {
        await fs.writeFile(
            path.join(__dirname, '../data/orders.json'),
            JSON.stringify(orders, null, 2)
        );
    } catch (error) {
        console.error('Error saving orders:', error);
        throw error;
    }
}

// Process payment and create order
router.post('/process-payment', async (req, res) => {
    const {
        fullName,
        email,
        phone,
        streetAddress,
        productId,
        productName,
        productPrice,
        quantity,
        totalAmount,
        vendorId
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
        vendorId,
        amount: Number(totalAmount),
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    try {
        const orders = await getOrders();
        orders.orders.push(orderData);
        await saveOrders(orders);

        console.log('\n=== Order Details ===');
        console.log(`Order ID: ${orderId}`);
        console.log(`Customer: ${fullName}`);
        console.log(`Product: ${productName}`);
        console.log(`Amount: ₹${totalAmount}`);
        console.log(`Shipping Address: ${streetAddress}`);
        console.log('\nVendor Confirmation Links:');
        console.log(`View Order: http://localhost:3001/payment/vendor/view/${orderId}`);
        console.log(`Quick Confirm: http://localhost:3001/payment/vendor/quick-confirm/${orderId}`);
        console.log('============================\n');

        res.redirect(`/payment/order-pending/${orderId}`);
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).render('error', {
            message: 'Error processing order',
            error: { status: 500 }
        });
    }
});

// Order pending page
router.get('/order-pending/:orderId', async (req, res) => {
    try {
        const orders = await getOrders();
        const order = orders.orders.find(o => o.id === req.params.orderId);

        if (!order) {
            console.error('Order not found:', req.params.orderId);
            return res.status(404).render('error', { message: 'Order not found' });
        }

        res.render('order-pending', {
            order,
            orderId: order.id
        });
    } catch (err) {
        console.error('Error in order-pending route:', err);
        res.status(500).render('error', { message: 'Internal server error' });
    }
});

// API endpoint to check order status
router.get('/api/check-order-status/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    console.log('\n=== Checking Order Status ===');
    console.log('Looking for order:', orderId);

    try {
        const orders = await getOrders();
        const order = orders.orders.find(o => o.id === orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            status: order.status,
            orderId: order.id,
            productName: order.productDetails.name,
            amount: order.amount
        });
    } catch (error) {
        console.error('Error checking order status:', error);
        res.status(500).json({ error: 'Error checking order status' });
    }
});

// Vendor view order page
router.get('/vendor/view/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    console.log('\n=== Accessing Vendor View Page ===');
    console.log('Looking for order:', orderId);

    try {
        const orders = await getOrders();
        const order = orders.orders.find(o => o.id === orderId);

        if (!order) {
            return res.render('error', {
                message: 'Order not found',
                error: { status: 404 }
            });
        }

        res.render('vendor-view', {
            orderId: order.id,
            customerName: order.customerName,
            email: order.email,
            phone: order.phone,
            address: order.address,
            productName: order.productDetails.name,
            quantity: order.productDetails.quantity,
            amount: order.amount,
            status: order.status
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).render('error', {
            message: 'Error loading order',
            error: { status: 500 }
        });
    }
});

// Quick confirm order
router.get('/vendor/quick-confirm/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    console.log('\n=== Processing Quick Confirmation ===');
    console.log('Looking for order:', orderId);

    try {
        const orders = await getOrders();
        const orderIndex = orders.orders.findIndex(o => o.id === orderId);

        if (orderIndex === -1) {
            return res.render('error', {
                message: 'Order not found',
                error: { status: 404 }
            });
        }

        // Update order status
        orders.orders[orderIndex].status = 'confirmed';
        await saveOrders(orders);

        console.log('Order confirmation successful');
        res.render('vendor-success', {
            orderId: orders.orders[orderIndex].id,
            customerName: orders.orders[orderIndex].customerName,
            productName: orders.orders[orderIndex].productDetails.name,
            amount: orders.orders[orderIndex].amount
        });
    } catch (error) {
        console.error('Error confirming order:', error);
        res.status(500).render('error', {
            message: 'Error confirming order',
            error: { status: 500 }
        });
    }
});

// Order confirmed page
router.get('/order-confirmed/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    console.log('\n=== Accessing Order Confirmed Page ===');
    console.log('Looking for order:', orderId);

    try {
        const orders = await getOrders();
        const order = orders.orders.find(o => o.id === orderId);

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
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).render('error', {
            message: 'Error loading order',
            error: { status: 500 }
        });
    }
});

module.exports = router; 