rm -rf build
pkg . --out-path build
cp -R ./node_modules/puppeteer/.local-chromium build/puppeteer
cp -R ./node_modules/fsevents/fsevents.node build/