module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4 exports a preset (it returns { plugins: [...] }).
    presets: ['babel-preset-expo', require.resolve('nativewind/babel')],
    // Expo Router works without a custom plugin in SDK 54+.
    plugins: [],
  };
};

