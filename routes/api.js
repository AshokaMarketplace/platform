const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { addProduct, addFounder } = require('../utils/dataManager');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'images') {
            cb(null, 'public/images/products/');
        } else if (file.fieldname === 'image') {
            cb(null, 'public/images/founders/');
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Add new product
router.post('/products', upload.array('images'), async (req, res) => {
    try {
        const productData = {
            ...req.body,
            images: req.files.map(file => '/images/products/' + file.filename),
            features: req.body.features.split('\n').filter(f => f.trim()),
            materials: req.body.materials.split(',').map(m => m.trim())
        };
        const product = await addProduct(productData);
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new founder
router.post('/founders', upload.single('image'), async (req, res) => {
    try {
        const founderData = {
            ...req.body,
            image: '/images/founders/' + req.file.filename,
            socialLinks: {
                instagram: req.body.instagram,
                linkedin: req.body.linkedin
            },
            achievements: req.body.achievements.split('\n').filter(a => a.trim())
        };
        const founder = await addFounder(founderData);
        res.json({ success: true, founder });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 