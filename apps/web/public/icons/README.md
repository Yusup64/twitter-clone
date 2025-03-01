# PWA 图标

这个文件夹应该包含以下尺寸的图标：

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

您可以使用在线工具如 [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) 或 [RealFaviconGenerator](https://realfavicongenerator.net/) 从一个高分辨率图像生成所有这些图标。

## 生成图标的步骤

1. 准备一个至少 512x512 像素的方形 PNG 图像作为您的应用图标
2. 使用 PWA Asset Generator 生成所有必要的图标：

```bash
npx pwa-asset-generator your-icon.png ./icons --icon-only --favicon
```

3. 将生成的图标放在这个文件夹中
4. 确保 manifest.json 中的图标路径正确指向这些图标 