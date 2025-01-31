const sharp = require("sharp");
const fs = require("fs");
const uuid = require("uuid");

async function convert(req, cb) {
  const hash = uuid.v4();
  const dir = `./public/outputs/${hash}`;
  const imageFile = req.files.image.data;
  var file = req.files.image.name.replace(/\.[^.]+$/, "") + ".avif";
  //   console.log(file);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const path = `./public/outputs/${hash}/${file}`;

  // if (file.includes(" ")) {
  //   file = encodeURIComponent(
  //     req.files.image.name.replace(/\.[^.]+$/, "") + ".avif"
  //   );
  // }

  sharp(imageFile)
    // .resize(240, 240)
    .toFormat("avif")
    .toFile(path)
    .then(function (data) {
      return cb({
        success: true,
        url: `${process.env.DOMAIN}/${hash}/${file}`,
        width: data.width,
        height: data.height,
        size: data.size,
      });
    })
    .catch(function (error) {
      console.log(error);
      return cb(error);
    });
}

module.exports = { convert };
