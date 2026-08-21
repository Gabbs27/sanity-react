Build a simple but genuinely useful weather app that displays real-time weather data for any city using JavaScript, HTML, CSS, and WeatherAPI. It is a good project to pick up after your first few tutorials, because it makes you deal with three things at once: talking to an API, writing asynchronous code, and handling the moment when the request comes back wrong.

No framework, no build step, no dependencies. Three files and a free API key.

## Step 1: Set up the project structure

Create a new folder for the project and add three files:

- `index.html`
- `style.css`
- `script.js`

You can open `index.html` directly in the browser. That is all the tooling this needs.

## Step 2: index.html

The markup is small. What matters is the IDs, because the JavaScript looks each element up by ID: `city-input`, `weather-info`, `city-name`, `temperature`, and `description`.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Weather App</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <header>
      <h1>Weather App</h1>
    </header>

    <main>
      <label for="city-input">Type a city and press Enter</label>
      <input
        type="text"
        id="city-input"
        name="city"
        autocomplete="off"
        placeholder="Santo Domingo"
      />

      <section id="weather-info" class="hidden" aria-live="polite">
        <h2 id="city-name"></h2>
        <p id="temperature"></p>
        <p id="description"></p>
      </section>
    </main>

    <script src="script.js"></script>
  </body>
</html>
```

Two details worth noticing. The `<label>` is tied to the input with `for="city-input"`, so clicking the text focuses the field and screen readers announce it. And `aria-live="polite"` on the results container means the new weather is read out when it appears, instead of changing silently.

The `<script>` tag goes at the end of `<body>` on purpose. The JavaScript calls `getElementById` as soon as it runs, so the elements have to exist already.

## Step 3: style.css

```css
body {
  font-family: Arial, sans-serif;
  text-align: center;
  background-color: #f0f0f0;
}

header {
  background-color: #3b3b3b;
  padding: 20px;
}

header h1 {
  color: #ffffff;
  margin: 0;
  font-size: 24px;
}

input[type="text"] {
  font-size: 18px;
  padding: 10px;
  width: 80%;
  max-width: 300px;
  margin-top: 40px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

#weather-info {
  margin-top: 40px;
}

.hidden {
  display: none;
}
```

Add these two rules at the bottom of the same file so the label sits on its own line above the input. They come later in the stylesheet, so the smaller `margin-top` wins over the earlier one:

```css
label {
  display: block;
  margin-top: 40px;
  color: #3b3b3b;
}

input[type="text"] {
  margin-top: 10px;
}
```

`.hidden` is the whole show/hide mechanism. The results block starts hidden and the JavaScript removes the class once there is something to show.

## Step 4: Register for WeatherAPI

Go to [weatherapi.com](https://www.weatherapi.com/) and sign up for a free account, then generate an API key from your dashboard. Keep the key somewhere handy, you need it in the next step.

## Step 5: script.js

```js
const cityInput = document.getElementById("city-input");
const weatherInfo = document.getElementById("weather-info");
const cityName = document.getElementById("city-name");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");

cityInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    fetchWeatherData(cityInput.value);
  }
});

async function fetchWeatherData(city) {
  const API_KEY = "your_weatherapi_key_here";
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&aqi=no`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }
    const data = await response.json();
    displayWeatherData(data);
  } catch (error) {
    console.error("Error:", error);
  }
}

function displayWeatherData(data) {
  cityName.textContent = data.location.name;
  temperature.textContent = `${data.current.temp_c}°C`;
  description.textContent = data.current.condition.text;
  weatherInfo.classList.remove("hidden");
}
```

Replace `your_weatherapi_key_here` with your actual WeatherAPI key. Save all three files, open `index.html`, type a city, press Enter.

## What the async function is actually doing

This is the real lesson of the project, so it is worth slowing down on the three pieces.

### await

`fetch` does not return the response. It returns a promise, an object that stands in for a result that has not arrived yet. `await` pauses the function until that promise settles, then hands you the value. The rest of the page keeps running while it waits, which is why nothing freezes.

You need two `await`s here because there are two waits: one for the response headers to arrive, and a second one for `response.json()` to finish reading and parsing the body.

### response.ok

`fetch` only rejects when the request itself fails, for example when the network is down. A 400 or a 401 from the server is still a successful round trip as far as `fetch` is concerned, so it resolves normally. If you skip the `response.ok` check, a bad API key or a misspelled city gives you a `data` object with no `location` in it, and the error you eventually see is a confusing `Cannot read properties of undefined`.

`response.ok` is simply `true` for any status in the 200 range. Checking it turns a silent wrong answer into a clear one.

### try/catch

`throw` inside an `async` function jumps straight to `catch`, and so does any rejected promise you awaited. That means one `catch` block covers the network failing, the JSON being unparseable, and the error you threw yourself.

## Handling a city that doesn't exist

This is the first thing a beginner hits, and right now the app does nothing visible: it logs to the console and the old weather stays on screen. When you send an unknown city, WeatherAPI responds with a non-OK status and a JSON body containing an `error` object with a `message` field explaining what went wrong. You can read that and put it in front of the user.

Add a place to show it, right after the `</section>` in `index.html`:

```html
<p id="error-message" class="hidden" role="alert"></p>
```

Then replace `fetchWeatherData` in `script.js` with this version, and add the two helpers below it:

```js
const errorMessage = document.getElementById("error-message");

async function fetchWeatherData(city) {
  const API_KEY = "your_weatherapi_key_here";
  if (!city.trim()) return;

  hideError();
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(
        city
      )}&aqi=no`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch weather data");
    }

    displayWeatherData(data);
  } catch (error) {
    console.error("Error:", error);
    showError(error.message);
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
  weatherInfo.classList.add("hidden");
}

function hideError() {
  errorMessage.classList.add("hidden");
}
```

Three changes matter here. The body is parsed *before* the `ok` check, so the error message is available to throw. `encodeURIComponent` means city names with spaces or accents survive the trip. And `showError` hides the stale weather, so the user is never looking at yesterday's city next to today's error.

A network failure lands in the same `catch`, but with a browser message like "Failed to fetch". If that bothers you, check `error instanceof TypeError` and show your own wording.

## About that API key

Your key is sitting in `script.js`, which the browser downloads in full. Anyone who opens DevTools can read it, copy it, and spend your quota. Minifying does not help, and neither does moving it to another file.

For learning, this is fine. Use a free key, and rotate it if you ever paste the file publicly. For anything real, the request belongs behind a small server endpoint of your own: your page calls `/api/weather?city=London`, the server holds the key, adds it, calls WeatherAPI, and returns the result. The key never reaches the browser. That is one short serverless function, and it is the right moment to learn one.

## Make it yours

**Show the weather icon.** `data.current.condition.icon` comes back as a URL with no protocol, like `//cdn.weatherapi.com/...`, so prefix it: `iconEl.src = "https:" + data.current.condition.icon;`. Give the `<img>` an `alt` of `data.current.condition.text`.

**Add a three day forecast.** Swap the endpoint to `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=3&aqi=no&alerts=no`. The response still has `location` and `current`, plus `data.forecast.forecastday`, an array you can loop over.

**Remember the last city.** Call `localStorage.setItem("lastCity", data.location.name)` inside `displayWeatherData`, then on load read it back and fetch it if it exists. Two lines, and the app feels like it knows you.

## Where this stops

The Enter key is the only way to trigger a search, which means no mouse and no comfortable path on mobile. Add a button that calls the same function before you show this to anyone. There is no loading state either, so on a slow connection the page looks broken for a second.

Beyond that, this is a learning project and it should stay one until the key moves to a server. If you want to build a weather feature people actually use, you will also want caching, since free tiers have request limits and hitting the API on every keystroke will burn through them fast. Get this version working first, then move the key, then worry about the rest.