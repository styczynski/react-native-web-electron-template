const express = require('express');
const path = require('path');

const app = express();

const devServerPort = process.env.REACT_BUILD_DEV_SERVER_PORT || 3000;

app.use('/', express.static('../build-web'));

app.listen(devServerPort, () => {
  console.log("[SERVER] Running on port "+devServerPort);
});