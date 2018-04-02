require('babel-polyfill')
require('babel-register')

const spawn       = require('child_process').spawn;

const callCommand = function(command, callback) {
    var command = spawn(command, {
      shell: true
    });

    command.stdout.on('data', function (data) {
      process.stdout.write(data);
    });

    command.stderr.on('data', function (data) {
      process.stdout.write(data);
    });
    
    command.on('error', (err) => {
      console.log('[Command] Error during execution of command!');
      console.log(err);
    });

    command.on('exit', function (code) {
      console.log('[Command] child process exited with code ' + code.toString());
      console.log("[Command] Command execution attempt was performed.");
      if(code != 0) {
        throw "Command returned a non-zero exit code! (could not execute the command)";
      }
      callback(null);
    });
};

const retrySpawnElectron = function() {
  console.log('[Electron] Spawn new electron shell...');
  callCommand('cd .. && node node_modules/electron/cli.js ./build-desktop/main.js', function(err){
    console.log('[Electron] Shell closed.');
    retrySpawnElectron();
  });
};

retrySpawnElectron();