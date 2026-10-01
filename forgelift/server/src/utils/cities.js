import fs from "fs";

// City data: GeoNames (https://www.geonames.org), CC BY 4.0. Cities with population >= 15,000.
// Rows are [geonameId, name, countryCode, population], largest first. See scripts/buildCities.mjs.
const rows = JSON.parse(fs.readFileSync(new URL("../data/cities.json", import.meta.url), "utf8"));
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const countryNameCache = new Map();
export const getCountryName = (countryCode) => {
  if (!countryNameCache.has(countryCode)) {
    let name = countryCode;
    try {
      name = countryNames.of(countryCode) || countryCode;
    } catch (_error) {
      name = countryCode;
    }
    countryNameCache.set(countryCode, name);
  }
  return countryNameCache.get(countryCode);
};

const cities = rows.map(([cityId, name, countryCode, population]) => ({
  cityId,
  name,
  countryCode,
  countryName: getCountryName(countryCode),
  population,
  searchName: normalize(name)
}));
const citiesById = new Map(cities.map((city) => [city.cityId, city]));

const toPublicCity = ({ searchName, ...city }) => city;

export const getCityById = (cityId) => {
  const city = citiesById.get(String(cityId || ""));
  return city ? toPublicCity(city) : null;
};

// "lon" finds London first (prefix matches, biggest cities first), then cities that
// merely contain the text. "london, canada" narrows by country name or code.
export const searchCities = (query, limit = 10) => {
  const [cityPart, countryPart] = String(query || "").split(",");
  const term = normalize(cityPart);
  const countryTerm = normalize(countryPart);
  if (term.length < 2) return [];

  const matchesCountry = (city) =>
    !countryTerm || normalize(city.countryName).startsWith(countryTerm) || city.countryCode.toLowerCase() === countryTerm;

  const prefix = [];
  const contains = [];
  for (const city of cities) {
    if (prefix.length >= limit) break;
    if (!matchesCountry(city)) continue;
    if (city.searchName.startsWith(term)) prefix.push(city);
    else if (contains.length < limit && city.searchName.includes(term)) contains.push(city);
  }

  const exact = [...prefix, ...contains];
  if (exact.length >= limit || term.length < 4) return exact.slice(0, limit).map(toPublicCity);

  // Typo-tolerant fallback for local spellings, e.g. "Prishtina" -> "Pristina".
  const maxDistance = term.length >= 7 ? 2 : 1;
  const seen = new Set(exact.map((city) => city.cityId));
  const fuzzy = [];
  for (const city of cities) {
    if (fuzzy.length + exact.length >= limit) break;
    if (seen.has(city.cityId) || !matchesCountry(city)) continue;
    if (prefixDistance(term, city.searchName, maxDistance) <= maxDistance) fuzzy.push(city);
  }

  return [...exact, ...fuzzy].slice(0, limit).map(toPublicCity);
};

// Smallest edit distance between `term` and a prefix of `name` of similar length.
function prefixDistance(term, name, maxDistance) {
  let best = Infinity;
  for (let length = term.length - maxDistance; length <= term.length + maxDistance; length += 1) {
    if (length < 1 || length > name.length) continue;
    best = Math.min(best, editDistance(term, name.slice(0, length), maxDistance));
    if (best === 0) break;
  }
  return best;
}

function editDistance(a, b, cap) {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > cap) return cap + 1;
    previous = current;
  }
  return previous[b.length];
}
