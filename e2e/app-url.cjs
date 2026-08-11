const path = require('path');
const { pathToFileURL } = require('url');

const APP_URL = pathToFileURL(path.resolve(__dirname, '..', 'dist', 'index.html')).href;

module.exports = { APP_URL };
