import { saveLastWeather } from "./localStorage";

const API_KEY = "38fdf0618f97e6dccb31a876df33fec7";

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
