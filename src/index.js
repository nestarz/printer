const path = require("path");
const carlo = require("carlo");
const chokidar = require("chokidar");

(async () => {
  const app = await carlo.launch({
    width: 500
  });
  app.on("exit", () => process.exit());
  app.serveFolder(path.join(__dirname, "www"));

  carlo.enterTestMode();
  const pdfApp = await carlo.launch();

  const render = async () => {
    await pdfApp.load("index.html");
    const page = pdfApp.mainWindow().pageForTest();
    await page.pdf({
      format: "A4",
      printBackground: true,
      path: path.join(__dirname, "www", "output", "temp.pdf")
    });
    await app.mainWindow().evaluate(() => {
      const embed = document.querySelector("#pdf");
      embed.src = "output/temp.pdf";
    });
    app.mainWindow().bringToFront();
  };

  app.exposeFunction("render", render);
  app.exposeFunction("set", result => {
    const folderpath = JSON.parse(result).args[0];
    pdfApp.serveFolder(folderpath);
    chokidar.watch(folderpath).on("change", render);
    render();
  });
  await app.load("index.html");
})();
