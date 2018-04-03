# React template for apps targetting Mobiles/Web/Desktop

To install node dependencies just do:
```
  npm install .
```

And install *fakeroot* needed by release modules:
```
  sudo apt-get install fakeroot
```

To release **Expo** (android/ios) you must set up environment variables (their names are defined in `release.expo-user-env` and `release.expo-passwd-env` - build.json)
By default it is `EXPO_USER_LOGIN` and `EXPO_USER_PASSWD`

You can create new Expo account then put the credentials there.

**Note:** Not all abuilds are now fully supported (becaouse of early stage of project)
Current list of fully supported builds:**

* web
* linux
* android

## Full release

To perform release of binaries for the all supported platforms do:
```
  npm run release
```

Then the `release` driectory will be created with the following contents:
```
  release
    | - web
    | - linux
    | - windows
    | - android
    \-  ios
```

## For web

### Development

To start dev server with autoreload please run:
```
  npm run web-dev
```

The server will be launched at localhost - port `dev.web-server-port` (build.json).

### Release

To prepare release files run:
```
  npm run web-release
```

The output files will be placed in the directory `./release-web`.

The output will be `index.html` available for static hosting by any server.

## For desktop

### Development

To start **Electron** with autoreload on application close please run:
```
  npm run desktop-dev
```

### Release

You can release desktop apps for the following platforms:
* Linux 32bit (run `npm run linux-release`)
* Windows 32bit (run `npm run windows-release`)

The release files will be available in `release-linux-ia3` and `release-win32-ia32` folders.

**Note:** You can build Linux releases only on Linux and similary for other platforms.

## For native mobile

### Development

To start *Expo* server for IP specified in `dev.expo-server-ip` (build.json)
please execute the following command:
```
  npm run mobile-dev
```

Then run *Expo* app on you phone entering the `exp://<IP>:<PORT>` (see `npm run mobile-dev` logs for actual address)
to run your app natively.

### Release

To release **Expo** you must set up environment variables (their names are defined in `release.expo-user-env` and `release.expo-passwd-env` - build.json)
By default it is `EXPO_USER_LOGIN` and `EXPO_USER_PASSWD`

That's the user and password for Expo account that the app will be published under.

Then run the command:
```
  npm android-release
```

Or/and:
```
  npm run ios-release
```

The release will be performed in-cloud (Expo servers).
The binaries will be saved to `android/ios-release` folders.

