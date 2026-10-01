import { MapPin } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { competitionService } from "../../services/competitionService.js";

const formatPopulation = (population) =>
  population >= 1000000 ? `${(population / 1000000).toFixed(1)}M people` : `${Math.round(population / 1000)}k people`;

const CitySearch = ({ value, onChange }) => {
  const [query, setQuery] = useState(value ? `${value.name}, ${value.countryName}` : "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2 || (value && term === `${value.name}, ${value.countryName}`)) {
      setResults([]);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const data = await competitionService.searchCities(term);
        if (!cancelled) {
          setResults(data.cities || []);
          setActiveIndex(0);
          setOpen(true);
        }
      } catch (_error) {
        if (!cancelled) setResults([]);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, value]);

  const choose = (city) => {
    onChange(city);
    setQuery(`${city.name}, ${city.countryName}`);
    setResults([]);
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (!open || !results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(results.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-200">Your city</span>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open && results.length > 0}
            autoComplete="off"
            className="min-h-11 w-full rounded-md border border-white/10 bg-black/30 py-3 pl-9 pr-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-forge-ember focus:ring-2 focus:ring-forge-ember/20 sm:text-sm"
            placeholder="Start typing, e.g. London or Prishtina"
            role="combobox"
            value={query}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onChange={(event) => {
              setQuery(event.target.value);
              if (value) onChange(null);
            }}
            onFocus={() => results.length && setOpen(true)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </label>
      {open && results.length ? (
        <ul
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-[#0b0d11] py-1 shadow-2xl"
          id={listId}
          role="listbox"
        >
          {results.map((city, index) => (
            <li
              aria-selected={index === activeIndex}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm ${
                index === activeIndex ? "bg-forge-ember/20 text-white" : "text-slate-200 hover:bg-white/5"
              }`}
              key={city.cityId}
              role="option"
              onMouseDown={(event) => {
                event.preventDefault();
                choose(city);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span>
                <span className="font-semibold">{city.name}</span>, {city.countryName}
              </span>
              <span className="shrink-0 text-xs text-slate-500">{formatPopulation(city.population)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!value && query.trim().length >= 2 && !results.length ? (
        <p className="mt-2 text-xs text-slate-500">No match yet. Try the city's English name, or the nearest bigger city.</p>
      ) : null}
    </div>
  );
};

export default CitySearch;
