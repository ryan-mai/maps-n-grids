import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.static("public"));

const MAP_STYLE = process.env.MAP_STYLE || "dataviz-dark";

app.get("/tiles/:z/:x/:y.png", async (req, res) => {
  const { z, x, y } = req.params;

  if (!process.env.MAPTILER_KEY) {
    res.status(403).send("MAPTILER_KEY not set on the server. Set MAPTILER_KEY in .env");
    return;
  }

  const url = `https://api.maptiler.com/maps/${MAP_STYLE}/${z}/${x}/${y}.png?key=${process.env.MAPTILER_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      res.status(response.status).send(`Tile proxy error: ${response.statusText}`);
      return;
    }
    res.set("Content-Type", "image/png");
    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Tile proxy failed");
  }
});

app.listen(3000);