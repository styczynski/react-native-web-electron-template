const fs          = require('fs');
const buildConfig = JSON.parse(fs.readFileSync('../build.json', 'utf8'));


const configureFn = function(mode) {
  
  const scopedConfig = buildConfig[mode];
  
  if(mode == 'dev') {
    
    if(scopedConfig['expo-server-ip']) {
      process.env.REACT_NATIVE_PACKAGER_HOSTNAME = scopedConfig['expo-server-ip'];
    }
    
    if(scopedConfig['web-server-port']) {
      process.env.REACT_BUILD_DEV_SERVER_PORT = scopedConfig['web-server-port'];
    }
    
    if(scopedConfig['web-server-cache']) {
      process.env.REACT_BUILD_DEV_CACHE = scopedConfig['web-server-cache'];
    }
    
    if(scopedConfig['web-server-lint']) {
      process.env.REACT_BUILD_DEV_LINT = scopedConfig['web-server-lint'];
    }
  
  } else if(mode == 'release') {
    
    if(scopedConfig['lint']) {
      process.env.REACT_BUILD_PROD_LINT = scopedConfig['lint'];
    }
    
  }
  
};


module.exports = function(mode) {
  configureFn(mode);
};