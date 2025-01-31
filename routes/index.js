const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const cors = require("cors");
router.use(cors());

const fileUpload = require("express-fileupload");
const converter = require("../model/convert.js");
const database = require("../model/database.js");

// database.addUser()

router.use(express.static("public"));
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(fileUpload());

async function authenticate(req, res, next) {
  if (!req.body.auth) {
    return res.status(403).json({
      success: false,
      message: "403 Forbidden",
    });
  } else {
    if (await database.findUserByApiKeyAndSecret(req, res)) {
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: "401 Unauthorized",
      });
    }
  }
}

function isJson(data) {
  try {
    JSON.parse(data);
  } catch (e) {
    return false;
  }
  return true;
}

router.post("/api/upload", authenticate, async (req, res) => {
  if (req.body.data && !isJson(req.body.data)) {
    return res.status(400).send("Invalid json data");
  }

  if (!req.files || !req.files.image) {
    return res.status(400).send("No image file uploaded");
  }

  if (!(await database.verifyQuota(req))) {
    return res.status(400).send("No quota left");
  }

  await converter.convert(req, (cb) => {
    console.log(cb);
    if (cb) {
      if (database.incUsage(req)) {
        return res.status(200).json(cb);
      }
    }
  });
});

router.post("/api/status", authenticate, async (req, res) => {
  res.status(200).json(await database.findUserByApiKeyAndSecret(req));
});

router.get("/:hash/:image", (req, res) => {
  const image = req.params.image;
  const hash = req.params.hash;
  const filePath = `./public/outputs/${hash}/${image}`;

  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File does not exist
      return res.status(404).send("File not found");
    }

    // File exists, send the image
    // res.send(`<img src="/outputs/${hash}/${image}">`);
    res.send(`<img src="/outputs/${hash}/${image}">`);
  });
});

module.exports = router;
