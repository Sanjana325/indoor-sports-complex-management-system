const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'payment_slips',
    allowed_formats: ['jpg', 'png', 'pdf'],
    resource_type: 'raw', // Support PDFs
  },
});

const uploadSlip = multer({ storage: storage });

module.exports = uploadSlip;
