const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const { ImageUpload } = require('../models/imageUpload');

// Leave room for multipart headers below Vercel's 4.5 MB request limit.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const parseImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 10 },
  fileFilter(req, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new Error('Please select JPG, PNG, or WebP images.'));
    }
    callback(null, true);
  },
}).array('images');

function uploadBuffer(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => error ? reject(error) : resolve(result.secure_url)
    );
    stream.end(file.buffer);
  });
}

function uploadImages(req, res) {
  parseImages(req, res, async (error) => {
    if (error) {
      return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
        .json({ success: false, message: error.message });
    }
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: 'Select at least one image.' });
    }
    if (files.reduce((total, file) => total + file.size, 0) > MAX_UPLOAD_BYTES) {
      return res.status(413).json({ success: false, message: 'Upload less than 4 MB at a time.' });
    }
    try {
      const images = [];
      for (const file of files) images.push(await uploadBuffer(file));
      await ImageUpload.create({ images });
      return res.status(200).json(images);
    } catch (error) {
      console.error('Image upload failed:', error.message);
      return res.status(502).json({ success: false, message: 'Image upload failed. Please retry.' });
    }
  });
}

// Older admin forms send { id, img } entries; client forms send URL strings.
function imageUrls(images) {
  if (!Array.isArray(images)) return [];
  return [...new Set(images.map((image) => typeof image === 'string' ? image : image?.img)
    .filter((url) => typeof url === 'string' && /^https?:\/\//.test(url)))];
}

module.exports = { uploadImages, imageUrls };
