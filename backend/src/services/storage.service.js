const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const crypto = require('crypto');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname ? file.originalname.split('.').pop().toLowerCase() : '';
    const isPdf = file.mimetype === 'application/pdf' || ext === 'pdf';
    
    if (isPdf) {
      return {
        folder: 'payment_slips',
        resource_type: 'image',
        format: 'jpg', // Rasterize PDF to JPG to bypass Cloudinary free-tier PDF blocks
      };
    }

    return {
      folder: 'payment_slips',
      resource_type: 'auto',
    };
  },
});

const uploadSlip = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG and PDF are allowed.'));
    }
  }
});

module.exports = uploadSlip;
