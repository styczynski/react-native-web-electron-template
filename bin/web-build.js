const gulp        = require('gulp');
const runSeq      = require('run-sequence');
const del         = require('del');
const plumber     = require('gulp-plumber');
const cache       = require('gulp-cached');
const webpack     = require('webpack');
const gulpWebpack = require('webpack-stream');
const download    = require('download-file');
const path        = require('path');
const nodemon     = require('gulp-nodemon');
const exec        = require('child_process').exec;
const spawn       = require('child_process').spawn;
const os          = require('os');
const fs          = require('fs');
const configure   = require('./configure.js');
const buildConfig = JSON.parse(fs.readFileSync('../build.json', 'utf8'));
const pckgConfig  = JSON.parse(fs.readFileSync('../package.json', 'utf8'));



configure('dev');

const PATHS = {
    srcWebBuild: './src/web/index.js',
    outWebBuild: './build-web',
    outWebRelease: './release-web',
    srcDesktopBuild: './src/desktop/index.js',
    outDesktopBuild: './build-desktop',
    srcDesktopMainBuild: './src/desktop/electron-entry.js',
    outDesktopMainBuild: './build-desktop',
    srcWatch: [
        '../src',
        '../src/*',
        '../src/**/*'
    ]
};


function installDep(dependency, callback) {
  runCommand('cd .. && npm install '+dependency, callback);
}

function packageApp(platform, callback) {
  console.log('[Desktop-release:'+platform+'] Package app for platform: '+platform);
    
  let packedFn = function(err, appPaths){};
    
  let packerPlatform = '';
  let packerArch = '';
    
  if(platform == 'win32-ia32') {
    packerPlatform = 'win32';
    packerArch = 'ia32';
    
    packedFn = function(err, appPaths){
      installDep('electron-winstaller', function(){
        const electronInstaller = require('electron-winstaller');
        resultPromise = electronInstaller.createWindowsInstaller({
          appDirectory: '../build-cache/package-'+platform+'/'+appName+'-'+platform,
          outputDirectory: '../release-'+platform,
          authors: appAuthors,
          exe: appName+'.exe'
        });
         
        resultPromise.then(function(){
          console.log('[Desktop-release:'+platform+'] Done.');
          
          console.log('[RELEASE] Generated release folder ./release-'+platform+' sources:');
          fs.readdirSync('../release-'+platform).forEach(function(file) {
            console.log(' - '+file);
          });
          
          callback();
        }, function(e){
          console.log('[Desktop-release:'+platform+'] Failed: '+e.message);
          callback(e);
        });
      });
    };
  } else if(platform == 'linux-ia32') {
    packerPlatform = 'linux';
    packerArch = 'ia32';
    
    packedFn = function(err, appPaths){
      installDep('electron-installer-linux', function(){
        const install = require('electron-installer-linux');
        const installDebian = install.debian;
        
        console.log('[Desktop-release:'+platform+'] Generate debian package...');
        
        installDebian({
          src: ('../build-cache/package-'+platform+'/'+appName+'-'+platform),
          dest: ('../release-'+platform),
          arch: 'i386'
        }).then(function() {
        console.log('[Desktop-release:'+platform+'] Done.');
        
        console.log("[RELEASE-DEBUG] Folder .:");
        fs.readdirSync('.').forEach(function(file) {
          console.log(' - '+file);
        });
        console.log("[RELEASE-DEBUG] Folder ..:");
        fs.readdirSync('..').forEach(function(file) {
          console.log(' - '+file);
        });
        console.log("[RELEASE-DEBUG] Folder ../build-cache:");
        fs.readdirSync('../build-cache').forEach(function(file) {
          console.log(' - '+file);
        });
        console.log("[RELEASE-DEBUG] Folder "+'../build-cache/package-'+platform+':');
        fs.readdirSync('../build-cache/package-'+platform).forEach(function(file) {
          console.log(' - '+file);
        });
        
        
        console.log('[RELEASE] Generated release folder ./release-'+platform+' sources:');
        fs.readdirSync('../release-'+platform).forEach(function(file) {
          console.log(' - '+file);
        });
        
        callback();

        }).catch(function(e) {
          throw e;
        });
      });
    };
  } else {
    throw "Unsupported platform: "+platform;
  }
    
  let pckgAuthor = pckgConfig.author || {};
  let pckgAuthorFull = (pckgAuthor.name || 'Anonymous author');
  if(pckgAuthor.email) {
    pckgAuthorFull += ' <' + pckgAuthor.email + '>';
  }
  if(pckgAuthor.url) {
    pckgAuthorFull += ' (' + pckgAuthor.url + ')';
  }
    
  let appName = pckgConfig.name || 'app';
  let appDescription = pckgConfig.description || 'No description';
  let appAuthors = pckgAuthorFull || 'Anonymous author';
  let appVersion = '1.0.0';
  let appDependencies = {};
  
  if(buildConfig.release) {
    if(buildConfig.release.desktop) {
      if(buildConfig.release.desktop[platform]) {
        if(buildConfig.release.desktop[platform].version) {
          appVersion = buildConfig.release.desktop[platform].version;
        }
      }
      if(buildConfig.release.desktop.dependencies) {
        appDependencies = buildConfig.release.desktop.dependencies;
      }
    }
  }
  
  const packageJSONConf = {
    "name": appName,
    "description": appDescription,
    "main": "./main.js",
    "version": appVersion,
    "dependencies": appDependencies
  };
    
  const packager = require('electron-packager');
  packager({
    dir: '../build-desktop',
    out: '../build-cache/package-'+platform,
    name: appName,
    platform: packerPlatform,
    arch: packerArch
  }, function(err, appPaths) {
      var fs = require('fs');
      const prevErr = err;
      fs.writeFile('../build-cache/package-'+platform+'/'+appName+'-'+platform+'/resources/app/package.json', JSON.stringify(packageJSONConf), function(err) {
        if(err) {
          throw err;
        }
        packedFn(prevErr, appPaths);
      });
  });
}

function runCommand(command, callback, resetCursorLive, noOutput, filterFn) {
    
    console.log("[Command] Execute "+command);
    
    var command = spawn(command, {
      shell: true
    });

    command.stdout.on('data', function (data) {
      if(!noOutput) {
        if(resetCursorLive) {
          process.stdout.write('\x1B[2J\x1B[0f');
        }
        if(filterFn) {
          data = filterFn(data);
        }
        process.stdout.write(data);
      }
    });

    command.stderr.on('data', function (data) {
      if(!noOutput) {
        if(resetCursorLive) {
          process.stdout.write('\x1B[2J\x1B[0f');
        }
        if(filterFn) {
          data = filterFn(data);
        }
        process.stdout.write(data);
      }
    });
    
    command.on('error', (err) => {
      if(!noOutput) {
        console.log('Error during execution of command!');
        console.log(err);
      }
    });

    command.on('exit', function (code) {
      if(!noOutput) {
        console.log('child process exited with code ' + code.toString());
        console.log("[Command] Command execution finished.");
        if(code != 0) {
          throw "Command returned a non-zero exit code! (could not execute the command)";
        }
      }
      callback();
    });
    
};

function runExpoCommandWithLogin(expoCommand, callback) {
    
  let expo_user = "root";
  let expo_passwd = "root";
  
  let expo_user_env = "EXPO_USER_LOGIN";
  let expo_passwd_env = "EXPO_USER_PASSWD";
  
  if(buildConfig['release']) {
    if(buildConfig['release']['expo-user-env']) {
      expo_user_env = buildConfig['release']['expo-user-env'];
    }
    
    if(buildConfig['release']['expo-passwd-env']) {
      expo_passwd_env = buildConfig['release']['expo-passwd-env'];
    }
  }
  
  if(!process.env[expo_user_env]) {
    throw "No "+expo_user_env+" environment variable was defined! Please define it.";
  } else {
    expo_user = process.env[expo_user_env];
  }
  
  if(!process.env[expo_passwd_env]) {
    throw "No "+expo_passwd_env+" environment variable was defined! Please define it.";
  } else {
    expo_passwd = process.env[expo_passwd_env];
  }
    
  const loginCommand = "cd .. && node node_modules/exp/bin/exp.js login --non-interactive -u \""+expo_user+"\" -p \""+expo_passwd+"\"";
  const logoutCommand = "cd .. && node node_modules/exp/bin/exp.js logout --non-interactive";
  
  console.log("[Expo command] Force try to logout (may-fail mode)...");
  exec(logoutCommand, function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      console.log("[Expo command] Try to login with given passwd and username...");
      
      let afterLoginExecuted = false;
      let timeoutKilled = false;
      
      const afterLogin = function() {
        if(afterLoginExecuted) return;
        afterLoginExecuted = true;
        console.log("[Expo command] Try to execute Expo command...");
        
        var command = spawn(expoCommand, {
          shell: true
        });

        command.stdout.on('data', function (data) {
          process.stdout.write(data);
        });

        command.stderr.on('data', function (data) {
          process.stdout.write(data);
        });
        
        command.on('error', (err) => {
          console.log('Error during execution of Expo command!');
          console.log(err);
        });

        command.on('exit', function (code) {
          console.log('child process exited with code ' + code.toString());
          console.log("[Expo command] Command execution attempt was performed.");
          if(code != 0) {
            throw "Expo command returned a non-zero exit code! (could not execute the Expo command)";
          }
          callback(err);
        });
        
      };
      
      const loginProcess = exec(loginCommand, function (err, stdout, stderr) {
        if(!timeoutKilled) {
          console.log("[Expo command] Login attempt performed.");
          console.log(stdout);
          console.log(stderr);
          if(err) {
            throw "Expo login returned an error (could not login)!";
          }
          afterLogin();
        }
      });
      
      setTimeout(function(){
          console.log("[Expo command] Killing login command - timeout (skip to executing commands)");
          timeoutKilled = true;
          loginProcess.kill();
          afterLogin();
      }, 5000);
  
  });
};


function runExpoCommandCaptureAppLink(command, callback) {
  let releaseAppLink = '';
  const captureURL = function(input) {
    const inputStr = input.toString();
    if(inputStr.indexOf('Successfully built standalone app:') != -1) {
      let appLink = inputStr.split('Successfully built standalone app:')[1];
      appLink = appLink || '';
      appLink = (appLink.replace(/\r\n/g, "\r").replace(/\n/g, "\r").split(/\r/))[0];
      releaseAppLink = appLink.trim();
    }
    return input;
  };
  
  runExpoCommandWithLogin(command, function(){
    callback(releaseAppLink);
  }, false, false, captureURL);
}

function downloadExpoAppRelease(url, releaseFolder, callback) {
  console.log('[Release] Downloading release files from \"'+url+'\"...');
     
  const options = {
    directory: "../"+releaseFolder
  }
     
  download(url, options, function(err){
    if (err) {
      throw err;
    }
    console.log('[RELEASE] Generated release folder '+releaseFolder+' sources:');
    fs.readdirSync(path.join('..', releaseFolder)).forEach(function(file) {
      console.log(' - '+file);
    });
    
    callback();
  });
}

gulp.task('android-release', function(callback) {
  configure('release');
  runExpoCommandCaptureAppLink("cd .. && node node_modules/exp/bin/exp.js build:android --non-interactive", function(appLink){
    downloadExpoAppRelease(appLink, 'android-release', callback);
  });
});

gulp.task('ios-release', function(callback) {
  configure('release');
  runExpoCommandCaptureAppLink("cd .. && node node_modules/exp/bin/exp.js build:ios --non-interactive", function(appLink){
    downloadExpoAppRelease(appLink, 'ios-release', callback);
  });
});

gulp.task('expo-start', function(callback) {
  runCommand("cd .. && react-native-scripts start --no-interactive", callback);
});

gulp.task('expo-start-android', function(callback) {
  runCommand("cd .. && react-native-scripts android --no-interactive", callback);
});

gulp.task('expo-start-ios', function(callback) {
  runCommand("cd .. && react-native-scripts ios --no-interactive", callback);
});

gulp.task('run-jest-tests', function(callback) {
  runCommand("cd .. && node node_modules/jest/bin/jest.js --verbose --colors --forceExit", callback);
});

gulp.task('run-flow-tests', function(callback) {
  const filterFn = function(input) {
    
    if (!String.prototype.padStart) {
      String.prototype.padStart = function padStart(targetLength,padString) {
        targetLength = targetLength>>0; //truncate if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (this.length > targetLength) {
          return String(this);
        } else {
          targetLength = targetLength-this.length;
          if (targetLength > padString.length) {
            padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
          }
          return padString.slice(0,targetLength) + String(this);
        }
      };
    }
    
    if(input.toString().indexOf('Server is initializing') != -1) {
        
      let parsedFilesPart = input.toString().split('parsed files')[1];
      if(parsedFilesPart) {
        parsedFilesPart = parsedFilesPart.split(')')[0];
      }
        
      if(parsedFilesPart) {
        return '\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\bLoading... Parsed '+parsedFilesPart.toString().padStart(10)+' files';
      } else {
        return '\b\b\b\b\b\b\b\b\b\bLoading...';
      }
    } else if(input.toString().indexOf('Server is starting up') != -1) {
      return input.toString() + '\n\n            ';
    }
    return input;
  };
  runCommand("cd .. && node node_modules/flow-bin/cli.js --color always", callback, false, false, filterFn);
});

gulp.task('web-build:release', function(callback){
  configure('release');
  return gulp.src(PATHS.srcWebBuild, {cwd: '..'})
    .pipe(cache('webpack', {optimizeMemory: true}))
    .pipe(plumber())
    .pipe(gulpWebpack( require('./web.prod.config.js') ))
    .pipe(gulp.dest(PATHS.outWebRelease, {cwd: '..'}));
});

gulp.task('web-build:release-finalize', function(callback) {
  console.log('[RELEASE] Generated release folder '+PATHS.outWebRelease+' sources:');
  fs.readdirSync(path.join('..', PATHS.outWebRelease)).forEach(function(file) {
    console.log(' - '+file);
  });
});

gulp.task('web-build:dev', function(callback){
  return gulp.src(PATHS.srcWebBuild, {cwd: '..'})
    .pipe(cache('webpack', {optimizeMemory: true}))
    .pipe(plumber())
    .pipe(gulpWebpack( require('./web.dev.config.js') ))
    .pipe(gulp.dest(PATHS.outWebBuild, {cwd: '..'}));
});

gulp.task('desktop-build-renderer:dev', function(callback){
  return gulp.src(PATHS.srcDesktopBuild, {cwd: '..'})
    .pipe(cache('webpack', {optimizeMemory: true}))
    .pipe(plumber())
    .pipe(gulpWebpack( require('./desktop.dev.config.js') ))
    .pipe(gulp.dest(PATHS.outDesktopBuild, {cwd: '..'}));
});

gulp.task('desktop-build-main:dev', function(callback){
  return gulp.src(PATHS.srcDesktopMainBuild, {cwd: '..'})
    .pipe(cache('webpack', {optimizeMemory: true}))
    .pipe(plumber())
    .pipe(gulpWebpack( require('./desktop-main.dev.config.js') ))
    .pipe(gulp.dest(PATHS.outDesktopMainBuild, {cwd: '..'}));
});

gulp.task('desktop-build-renderer:release', function(callback){
  return gulp.src(PATHS.srcDesktopBuild, {cwd: '..'})
    .pipe(cache('webpack', {optimizeMemory: true}))
    .pipe(plumber())
    .pipe(gulpWebpack( require('./desktop.release.config.js') ))
    .pipe(gulp.dest(PATHS.outDesktopBuild, {cwd: '..'}));
});

gulp.task('desktop-build-main:release', function(callback){
  return gulp.src(PATHS.srcDesktopMainBuild, {cwd: '..'})
    .pipe(cache('webpack', {optimizeMemory: true}))
    .pipe(plumber())
    .pipe(gulpWebpack( require('./desktop-main.release.config.js') ))
    .pipe(gulp.dest(PATHS.outDesktopMainBuild, {cwd: '..'}));
});


gulp.task('desktop-package:win32-ia32', function(callback) {
  packageApp('win32-ia32', callback);
});

gulp.task('desktop-package:linux-ia32', function(callback) {
  packageApp('linux-ia32', callback);
});

gulp.task('web-watch', function() {
  gulp.start('web-build:dev');
  gulp.watch(
    PATHS.srcWatch,
    {
      interval: 3007,
      dot: true
    }, [
    'web-build:dev'
  ]);
});

gulp.task('desktop-watch', function() {
  gulp.start('desktop-build-renderer:dev', 'desktop-build-main:dev');
  gulp.watch(
    PATHS.srcWatch,
    {
      interval: 3007,
      dot: true
    }, [
    'desktop-build-renderer:dev',
    'desktop-build-main:dev'
  ]);
});

gulp.task('web-server', function(){
  nodemon({
    'script': './run-server.js',
    ext: 'html'
  })
});

gulp.task('desktop-server', function(){
  nodemon({
    'script': './run-electron.js'
  })
});

gulp.task('clear-cache', function () {
  var tempDir = os.tmpdir();

  var cacheFiles = fs.readdirSync(tempDir).filter(function (fileName) {
    return fileName.indexOf('react-packager-cache') === 0;
  });

  cacheFiles.forEach(function (cacheFile) {
    var cacheFilePath = path.join(tempDir, cacheFile);
    fs.unlinkSync(cacheFilePath);
    console.log('Deleted cache: ', cacheFilePath);
  });

  if (!cacheFiles.length) {
    console.log('No cache files found!');
  }
});

gulp.task('web-dev', function(){
  gulp.start('web-server', 'web-watch');
});

gulp.task('desktop-dev', function(){
  gulp.start('desktop-watch', 'desktop-server');
});

gulp.task('win32-ia32-release', function(){
  runSeq('desktop-build-renderer:dev', 'desktop-build-main:dev', 'desktop-package:win32-ia32');
});

gulp.task('linux-ia32-release', function(){
  runSeq('desktop-build-renderer:dev', 'desktop-build-main:dev', 'desktop-package:linux-ia32');
});

gulp.task('web-release', function(){
  configure('release');
  runSeq('web-build:release', 'web-build:release-finalize');
});

gulp.task('mobile-dev', function(){
  gulp.start('expo-start');
});

gulp.task('android-dev', function(){
  gulp.start('expo-start-android');
});

gulp.task('ios-dev', function(){
  gulp.start('expo-start-ios');
});

gulp.task('test-jest', function(){
  gulp.start('run-jest-tests');
});

gulp.task('test-flow', function(){
  gulp.start('run-flow-tests');
});

gulp.task('test', function(){
  runSeq('test-flow', 'test-jest');
});
