// var express = require('express');
// var router = express.Router();
// var controllers = require('../controllers');

const express = require('express');
const router = express.Router();
const controllers = require('../controllers/index');
const upload = require('../config/multer');
const founders = require('../data/founders');

router.get('/', controllers.getHome);
router.get('/products', controllers.getProducts);
router.get('/product/:id', controllers.getProduct);
router.get('/payment/:id', controllers.getPayment);
router.post('/payment/confirm', controllers.postPaymentConfirm);
router.get('/vendor/confirm/:orderId', controllers.getVendorConfirm);
router.post('/order-confirmation', controllers.postOrderConfirmation);
router.get('/seller', controllers.getSeller);
router.get('/dashboard', controllers.getDashboard);
router.get('/about', controllers.getAbout);
router.get('/stories', controllers.getStories);
router.get('/account', controllers.getAccount); // Updated to use controller
// router.post('/seller', controllers.postSeller);
router.get('/seller/register', controllers.getSellerRegister);
router.post('/seller/register', upload, controllers.postSellerRegister);
router.get('/test', (req, res) => {
    res.send('<p class="text-green-600">HTMX works!</p>');
});
router.get('/founder/:id', (req, res) => {
    const founder = founders[req.params.id];
    if (!founder) {
        return res.status(404).render('error', {
            message: 'Founder not found',
            error: { status: 404 }
        });
    }
    res.render('founder', { founder });
});

module.exports = router;