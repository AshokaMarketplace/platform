const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'upi-qr-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 6 } // 5MB limit per file, max 6 files (1 QR + 5 product images)
}).fields([
    { name: 'qrCode', maxCount: 1 },
    { name: 'productImages', maxCount: 5 }
]);

module.exports = upload;