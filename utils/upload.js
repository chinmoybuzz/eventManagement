const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mime = require("mime");

const generateRandomString = async (length) => {
  return crypto.randomBytes(length).toString("hex");
};
const getExtension = (path) => {
  const arr = path?.split(".");
  return arr[arr.length - 1];
};
const uploadBinaryFile = async (params) => {
  const fileName = params.file.name || new Date().getTime();
  const extension = getExtension(params.file.originalname);
  const randomString = await generateRandomString(12);
  const uniqueFileName = `${fileName}${randomString}.${extension}`;

  !fs.existsSync(path.join(__dirname, `../public/storage/${params.folder}`)) &&
    fs.mkdirSync(path.join(__dirname, `../public/storage/${params.folder}`));

  fs.writeFileSync(
    path.join(
      __dirname,
      `../public/storage/${params.folder}/${uniqueFileName}`
    ),
    params.file.buffer
  );

  return {
    size: params.file.size,
    url: `storage/${params.folder}/${uniqueFileName}`,
    filename: params.file.originalname,
    extension,
  };
};

const deleteFile = (filePath) => {
  fs.existsSync(path.join(__dirname, `../public/${filePath}`)) &&
    fs.unlinkSync(path.join(__dirname, `../public/${filePath}`));
};

module.exports = { uploadBinaryFile, deleteFile };
