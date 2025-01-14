const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadCloudinary = async (req) => {
  return new Promise((resolve, reject) => {

    let cld_upload_stream = cloudinary.uploader.upload_stream(
     {
       folder: req.folder
     },
     (error,result) => {

       if (result) {
         resolve(result);
       } else {
         reject(error);
        }
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
  });
};

module.exports = { uploadCloudinary };
