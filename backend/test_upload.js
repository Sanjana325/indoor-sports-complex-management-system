require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');
const fs = require('fs');

async function testUpload() {
  // Create a dummy pdf file
  fs.writeFileSync('dummy.pdf', '%PDF-1.4\n%EOF\n');

  try {
    // 1. Test image auto
    console.log('Testing image/auto upload...');
    const res1 = await cloudinary.uploader.upload('dummy.pdf', {
      folder: 'payment_slips_test',
      resource_type: 'auto'
    });
    console.log('Auto URL:', res1.secure_url);

    // 2. Test raw with format
    console.log('\nTesting raw upload with format...');
    const res2 = await cloudinary.uploader.upload('dummy.pdf', {
      folder: 'payment_slips_test',
      resource_type: 'raw',
      format: 'pdf'
    });
    console.log('Raw URL:', res2.secure_url);

    // 3. Test raw with public_id override
    console.log('\nTesting raw upload with public_id override...');
    const res3 = await cloudinary.uploader.upload('dummy.pdf', {
      folder: 'payment_slips_test',
      resource_type: 'raw',
      public_id: 'test_pdf_override.pdf'
    });
    console.log('Raw Override URL:', res3.secure_url);

  } catch (err) {
    console.error('Upload Error:', JSON.stringify(err, null, 2));
  } finally {
    if (fs.existsSync('dummy.pdf')) fs.unlinkSync('dummy.pdf');
  }
}

testUpload();
