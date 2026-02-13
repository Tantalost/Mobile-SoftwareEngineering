module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['inline-dotenv', {
        path: 'ibt-mobile/.env'
      }],
      'react-native-reanimated/plugin', 
    ],
  };
};