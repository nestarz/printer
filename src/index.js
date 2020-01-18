const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");
const puppeteer = require("puppeteer");
const chokidar = require("chokidar");
const { app, messageNode, BrowserWindow } = require("deskgap");
const express = require("express");
const serve_app = express();
serve_app.listen(4200);

const isRemoteHTML = url => {
  return fetch(url, { method: "HEAD" })
    .then(response =>
      response.headers.get("content-type").includes("text/html")
    )
    .catch(_ => false);
};

const render = async url => {
  console.log("init");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const output = `temp.pdf`;
  console.log("ongoing");
  await page.emulateMedia("print");
  await page.goto(url, { timeout: 0, waitFor: "networkidle2" });
  await page.pdf({
    path: path.join(__dirname, output),
    printBackground: true,
    preferCSSPageSize: true
  });
  await browser.close();
  console.log("done");
};

let watcher;
const setup = async (url, win) => {
  const local = fs.existsSync(url) && path.extname(url) === ".html";
  const remote = await isRemoteHTML(url);
  if (local || remote) {
    if (local) {
      serve_app.use(express.static(path.dirname(url)));
    }
    const pipeline = () =>
      render(fs.existsSync(url) ? `http://localhost:4200/` : url)
        .then(_ => {
          win.webContents.reload();
          win.show();
        })
        .catch(err => {
          console.error(err);
          win.webContents.send("error", err);
        });

    if (watcher) watcher.close();
    watcher = chokidar
      .watch(url, { ignored: /(^|[\/\\])\../ })
      .on("change", pipeline);
    pipeline();
  } else {
    const err = `Wrong URL, must be a valid HTML file. (${url})`;
    console.error(err);
    return win.webContents.send("error", err);
  }
};

app.once("ready", () => {
  const win = new BrowserWindow({
    width: 500,
    height: 800
  });
  win.loadFile("src/index.html");
  messageNode.on("click", (_, url) => setup(url, win));
  messageNode.once("setup", (_, url) => setup(url, win));
});
