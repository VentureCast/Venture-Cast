module.exports = {
  assets: ['./Assets/Fonts/'], // Include fonts or other custom assets
  dependencies: {
    'react-native-some-library': {
      platforms: {
        ios: null, // Disable auto-linking for iOS if needed
      },
    },
  },
  project: {
    ios: {
      sourceDir: './ios',
    },
    android: {
      sourceDir: './android',
    },
  },
  commands: [
  ],
};
