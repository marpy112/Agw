const { uploadImages, imageUrls } = require("../helper/uploadImages");
const { HomeSideBanners } = require("../models/homeSideBanner");
const express = require("express");
const router = express.Router();

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

router.post(`/upload`, uploadImages);

router.get(`/`, async (req, res) => {
  try {
    const bannerList = await HomeSideBanners.find();

    if (!bannerList) {
      res.status(500).json({ success: false });
    }

    return res.status(200).json(bannerList);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get("/:id", async (req, res) => {
  slideEditId = req.params.id;

  const slide = await HomeSideBanners.findById(req.params.id);

  if (!slide) {
    res
      .status(500)
      .json({ message: "The Banner with the given ID was not found." });
  }
  return res.status(200).send(slide);
});

router.post("/create", async (req, res) => {
  let newEntry = new HomeSideBanners({
    images: imageUrls(req.body.images),
    catId: req.body.catId,
    catName:req.body.catName,
    subCatId: req.body.subCatId,
    subCatName:req.body.subCatName
  });

  if (!newEntry) {
    res.status(500).json({
      error: err,
      success: false,
    });
  }

  newEntry = await newEntry.save();

  res.status(201).json(newEntry);
});

router.delete("/deleteImage", async (req, res) => {
  const imgUrl = req.query.img;

  // console.log(imgUrl)

  const urlArr = imgUrl.split("/");
  const image = urlArr[urlArr.length - 1];

  const imageName = image.split(".")[0];

  const response = await cloudinary.uploader.destroy(
    imageName,
    (error, result) => {
      // console.log(error, res)
    }
  );

  if (response) {
    res.status(200).send(response);
  }
});

router.delete("/:id", async (req, res) => {
  const item = await HomeSideBanners.findById(req.params.id);
  const images = item.images;

  for (img of images) {
    const imgUrl = img;
    const urlArr = imgUrl.split("/");
    const image = urlArr[urlArr.length - 1];

    const imageName = image.split(".")[0];

    cloudinary.uploader.destroy(imageName, (error, result) => {
      // console.log(error, result);
    });
    //  console.log(imageName)
  }

  const deletedItem = await HomeSideBanners.findByIdAndDelete(req.params.id);

  if (!deletedItem) {
    res.status(404).json({
      message: "Banner not found!",
      success: false,
    });
  }

  res.status(200).json({
    success: true,
    message: "Banner Deleted!",
  });
});

router.put("/:id", async (req, res) => {
  const slideItem = await HomeSideBanners.findByIdAndUpdate(
    req.params.id,
    {
      images: imageUrls(req.body.images),
      catId: req.body.catId,
      catName:req.body.catName,
      subCatId: req.body.subCatId,
      subCatName:req.body.subCatName
    },
    { new: true }
  );

  if (!slideItem) {
    return res.status(500).json({
      message: "Item cannot be updated!",
      success: false,
    });
  }

  res.send(slideItem);
});

module.exports = router;
