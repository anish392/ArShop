const { getDefaultConfig } = require("@expo/metro-config");
/** @type {import('expo/metro-config').MetroConfig} */

const defaultConfig = getDefaultConfig(__dirname);

["js", "jsx", "json", "ts", "tsx", "cjs", "mjs"].forEach((ext) => {
  if (defaultConfig.resolver.sourceExts.indexOf(ext) === -1) {
    defaultConfig.resolver.sourceExts.push(ext);
  }
});
["glb", "gltf", "png", "mtl", "jpg", "obj"].forEach((ext) => {
  if (defaultConfig.resolver.sourceExts.indexOf(ext) === -1) {
    defaultConfig.resolver.sourceExts.push(ext);
  }
});

module.exports = defaultConfig;
