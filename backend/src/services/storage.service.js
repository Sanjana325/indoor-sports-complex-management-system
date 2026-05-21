const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// configure cloudinary storage settings
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // identify file extension and type
    const ext = file.originalname ? file.originalname.split('.').pop().toLowerCase() : '';
    const isPdf = file.mimetype === 'application/pdf' || ext === 'pdf';
    
    // handle pdf uploads by converting to jpg
    if (isPdf) {
      return {
        folder: 'payment_slips',
        resource_type: 'image',
        format: 'jpg', 
      };
    }

    // handle standard image uploads
    return {
      folder: 'payment_slips',
      resource_type: 'auto',
    };
  },
});

// setup multer middleware for bank slip uploads
const uploadSlip = multer({ 
  storage: storage,
  // set 5mb file size limit
  limits: {
    fileSize: 5 * 1024 * 1024 
  },
  // validate file format
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

