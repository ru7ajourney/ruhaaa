const express = require("express");
const https = require("https");
const http = require("http");

const router = express.Router();

// GET /api/geo — يرجع بلد الزائر بناءً على IP
router.get("/", (req, res) => {
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "";

  // في التطوير المحلي الـ IP يكون ::1 أو 127.0.0.1
  const isLocal = ip === "::1" || ip === "127.0.0.1" || ip === "localhost" || !ip;
  if (isLocal) {
    return res.json({ country: "SA", countryName: "Saudi Arabia", city: null, local: true });
  }

  const url = `http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`;

  http.get(url, (apiRes) => {
    let data = "";
    apiRes.on("data", (chunk) => (data += chunk));
    apiRes.on("end", () => {
      try {
        const json = JSON.parse(data);
        if (json.status === "success") {
          res.json({ country: json.countryCode, countryName: json.country, city: json.city });
        } else {
          res.json({ country: null, countryName: null, city: null });
        }
      } catch {
        res.json({ country: null, countryName: null, city: null });
      }
    });
  }).on("error", () => {
    res.json({ country: null, countryName: null, city: null });
  });
});

module.exports = router;
