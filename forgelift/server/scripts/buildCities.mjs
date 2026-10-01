// Regenerates src/data/cities.json from GeoNames data (CC BY 4.0, https://www.geonames.org).
// Usage (from forgelift/server): npm install --no-save all-the-cities && node scripts/buildCities.mjs
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const cities = require("all-the-cities");
const MIN_POPULATION = 15000;

// [geonameId, name, countryCode, population], largest first so search shows big cities first.
const rows = cities
  .filter((city) => city.population >= MIN_POPULATION && city.name && city.country)
  .sort((a, b) => b.population - a.population)
  .map((city) => [String(city.cityId), city.name, city.country, city.population]);

fs.writeFileSync(new URL("../src/data/cities.json", import.meta.url), JSON.stringify(rows));
console.log(`Wrote ${rows.length} cities`);
