import { saveLastWeather } from "./localStorage";

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;

export async function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch weather");
  }

  const data = await response.json();

  const formatted = {
    city: data.name,
    temp: data.main.temp,
    condition: data.weather[0].main,
    description: data.weather[0].description,
  };

  await saveLastWeather(formatted);
  return formatted;
}

export async function fetchForecastForDate(lat, lon, selectedDate) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch forecast");
  }

  const data = await response.json();

  const selectedKey = selectedDate.toISOString().slice(0, 10);
  const now = new Date();

  const sameDayForecasts = (data.list || []).filter((item) => {
    const itemDate = new Date(item.dt * 1000);
    return itemDate.toISOString().slice(0, 10) === selectedKey;
  });

  if (!sameDayForecasts.length) {
    // If selected day is today, fall back to current weather
    const isToday =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();

    if (isToday) {
      return await fetchWeather(lat, lon);
    }

    return null;
  }

  // Pick the forecast closest to midday for a reasonable day summary
  const targetHour = 12;
  let best = sameDayForecasts[0];
  let bestDiff = Infinity;

  for (const item of sameDayForecasts) {
    const itemDate = new Date(item.dt * 1000);
    const diff = Math.abs(itemDate.getHours() - targetHour);
    if (diff < bestDiff) {
      best = item;
      bestDiff = diff;
    }
  }

  return {
    city: data.city?.name || "Forecast",
    temp: best.main.temp,
    condition: best.weather?.[0]?.main || "Unknown",
    description: best.weather?.[0]?.description || "",
  };
}
