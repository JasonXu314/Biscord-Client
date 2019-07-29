const path = require('path');
module.exports = {
  entry: './src/obj-oriented-client.js',
  output: {
    filename: 'client.js',
    path: path.resolve(__dirname, 'dist')
  }
};