const sharp = require("sharp");

async function createIcons() {
  await sharp("public/logo.jpg")
    .resize(192, 192)
    .png()
    .toFile("public/icon-192.png");

  await sharp("public/logo.jpg")
    .resize(512, 512)
    .png()
    .toFile("public/icon-512.png");

  console.log("PWA icons created successfully!");
}

createIcons();