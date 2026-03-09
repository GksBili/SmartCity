function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function normalizeCondition(condition = "") {
  const lower = condition.toLowerCase();

  if (lower.includes("thunder")) return "thunderstorm";
  if (lower.includes("drizzle")) return "drizzle";
  if (lower.includes("rain")) return "rain";
  if (lower.includes("snow")) return "snow";
  if (lower.includes("mist") || lower.includes("fog") || lower.includes("haze"))
    return "fog";
  if (lower.includes("cloud")) return "clouds";
  if (lower.includes("clear") || lower.includes("sun")) return "clear";

  return "other";
}

function getTemperatureBand(temp) {
  if (temp <= 0) return "freezing";
  if (temp <= 8) return "cold";
  if (temp <= 15) return "cool";
  if (temp <= 22) return "mild";
  if (temp <= 28) return "warm";
  return "hot";
}

export function getRecommendation(condition, temp, date = new Date()) {
  const hour = date.getHours();
  const timeOfDay = getTimeOfDay(hour);
  const weatherType = normalizeCondition(condition);
  const tempBand = getTemperatureBand(temp);

  const recommendation = {
    summary: "",
    clothing: "",
    activity: "",
    foodDrink: "",
    mood: "",
    timeOfDay,
    weatherType,
    tempBand,
  };

  // THUNDERSTORM
  if (weatherType === "thunderstorm") {
    recommendation.summary =
      "Stormy conditions make this a better time for safer indoor plans.";
    recommendation.clothing =
      "Wear a waterproof jacket and sturdy shoes, and avoid being outside too long.";
    recommendation.activity =
      timeOfDay === "night"
        ? "Stay in and relax somewhere cozy indoors."
        : "Try a café, museum, library, or shopping area nearby.";
    recommendation.foodDrink =
      timeOfDay === "morning"
        ? "A hot coffee or tea would suit the weather."
        : "A warm drink or comfort food would fit well today.";
    recommendation.mood = "Cozy, low-key, and indoors.";
    return recommendation;
  }

  // RAIN / DRIZZLE
  if (weatherType === "rain" || weatherType === "drizzle") {
    if (tempBand === "freezing" || tempBand === "cold") {
      recommendation.summary = "Cold rain makes this a strong indoor day.";
      recommendation.clothing =
        "Wear a rain jacket, layers, and waterproof shoes.";
      recommendation.activity =
        timeOfDay === "morning"
          ? "Grab coffee or breakfast somewhere warm."
          : timeOfDay === "afternoon"
            ? "Check out an indoor café, bookstore, or mall."
            : "Go for dinner, dessert, or a movie indoors.";
      recommendation.foodDrink =
        "Something warm like coffee, tea, soup, or pasta would fit nicely.";
      recommendation.mood = "Warm, sheltered, and relaxed.";
      return recommendation;
    }

    recommendation.summary =
      "Rainy weather is manageable, but indoor or covered plans will feel best.";
    recommendation.clothing =
      "Bring a light waterproof layer and shoes you do not mind getting wet.";
    recommendation.activity =
      timeOfDay === "morning"
        ? "A breakfast spot or covered walk would be a good start."
        : timeOfDay === "afternoon"
          ? "Try a café, gallery, or covered shopping area."
          : "A cozy dinner spot or dessert place would be ideal.";
    recommendation.foodDrink =
      "Coffee, tea, pastries, or a warm meal would match the weather well.";
    recommendation.mood = "Calm, reflective, and cozy.";
    return recommendation;
  }

  // SNOW
  if (weatherType === "snow") {
    recommendation.summary =
      "Snow makes the city feel scenic, but comfort and warmth matter most.";
    recommendation.clothing =
      "Wear a heavy jacket, warm layers, and good boots.";
    recommendation.activity =
      timeOfDay === "morning"
        ? "A quiet coffee run or short scenic walk could be nice."
        : timeOfDay === "afternoon"
          ? "Enjoy a short outdoor stroll, then warm up indoors."
          : "Keep plans cozy with dinner or dessert indoors.";
    recommendation.foodDrink =
      "Hot chocolate, coffee, soup, or other warm comfort food fits perfectly.";
    recommendation.mood = "Scenic, cozy, and wintery.";
    return recommendation;
  }

  // FOG / MIST / HAZE
  if (weatherType === "fog") {
    recommendation.summary =
      "Low-visibility weather gives the city a quieter, moodier feel.";
    recommendation.clothing =
      tempBand === "cold" || tempBand === "freezing"
        ? "Wear warm layers and a jacket."
        : "A light jacket or hoodie should be enough.";
    recommendation.activity =
      timeOfDay === "morning"
        ? "A slow breakfast or coffee stop suits this kind of morning."
        : timeOfDay === "afternoon"
          ? "Take it easy with a short walk or an indoor spot."
          : "A calm dinner or lounge-type place would work well.";
    recommendation.foodDrink =
      "Coffee, tea, or a warm drink matches the atmosphere.";
    recommendation.mood = "Quiet, moody, and calm.";
    return recommendation;
  }

  // CLEAR
  if (weatherType === "clear") {
    if (tempBand === "freezing" || tempBand === "cold") {
      recommendation.summary =
        "It may be sunny, but the air is still cold, so bundle up for outdoor time.";
      recommendation.clothing =
        "Wear a warm coat, layers, and maybe gloves if you will be outside for long.";
      recommendation.activity =
        timeOfDay === "morning"
          ? "A crisp morning walk and coffee would be a nice start."
          : timeOfDay === "afternoon"
            ? "Great for a scenic park stop or outdoor exploring."
            : "A short evening walk before heading indoors could be nice.";
      recommendation.foodDrink =
        "Coffee, tea, or something warm pairs well with the cold air.";
      recommendation.mood = "Fresh, bright, and energizing.";
      return recommendation;
    }

    if (tempBand === "cool" || tempBand === "mild") {
      recommendation.summary =
        "This is ideal weather for exploring the city comfortably.";
      recommendation.clothing = "A light jacket or sweater should be enough.";
      recommendation.activity =
        timeOfDay === "morning"
          ? "Perfect for a coffee run, brunch, or morning walk."
          : timeOfDay === "afternoon"
            ? "Great time for parks, cafés, shopping streets, or sightseeing."
            : "Nice weather for dinner out or an evening walk.";
      recommendation.foodDrink =
        timeOfDay === "morning"
          ? "Coffee or brunch would be a strong fit."
          : "A patio meal or sweet treat would work well.";
      recommendation.mood = "Balanced, upbeat, and easygoing.";
      return recommendation;
    }

    if (tempBand === "warm" || tempBand === "hot") {
      recommendation.summary =
        "Beautiful weather for being outside, as long as you stay comfortable in the heat.";
      recommendation.clothing =
        "Wear light clothes, sunglasses, and consider sunscreen.";
      recommendation.activity =
        timeOfDay === "morning"
          ? "A morning walk or outdoor coffee before it gets hotter would be great."
          : timeOfDay === "afternoon"
            ? "Perfect for parks, patios, and outdoor attractions."
            : "A patio dinner or sunset walk would be ideal.";
      recommendation.foodDrink =
        "Something cold and refreshing would suit the weather best.";
      recommendation.mood = "Bright, social, and active.";
      return recommendation;
    }
  }

  // CLOUDS
  if (weatherType === "clouds") {
    if (tempBand === "freezing" || tempBand === "cold") {
      recommendation.summary =
        "Chilly cloudy weather makes for a slower-paced day.";
      recommendation.clothing = "Wear a coat or warm hoodie with layers.";
      recommendation.activity =
        timeOfDay === "morning"
          ? "A warm breakfast or coffee stop would be a great start."
          : timeOfDay === "afternoon"
            ? "Good day for casual indoor exploring or a short walk."
            : "Dinner somewhere warm and comfortable would fit well.";
      recommendation.foodDrink =
        "Coffee, tea, or comfort food would suit today.";
      recommendation.mood = "Laid-back and cozy.";
      return recommendation;
    }

    if (tempBand === "cool" || tempBand === "mild") {
      recommendation.summary =
        "Cloudy but comfortable weather is great for flexible city plans.";
      recommendation.clothing = "A hoodie or light layer should be enough.";
      recommendation.activity =
        timeOfDay === "morning"
          ? "Brunch, coffee, or a casual walk would work well."
          : timeOfDay === "afternoon"
            ? "A nice time for cafés, shopping, parks, or neighborhood exploring."
            : "Good evening for dinner out or a relaxed hangout.";
      recommendation.foodDrink =
        "Coffee, pastries, or a casual meal would all work nicely.";
      recommendation.mood = "Relaxed, casual, and easygoing.";
      return recommendation;
    }

    recommendation.summary =
      "Warm cloudy weather is comfortable and easy to plan around.";
    recommendation.clothing =
      "Light clothing should be fine, with maybe a light layer just in case.";
    recommendation.activity =
      timeOfDay === "morning"
        ? "A morning walk or breakfast spot would be a good call."
        : timeOfDay === "afternoon"
          ? "Great for exploring without the full heat of strong sun."
          : "A comfortable evening for dinner or a stroll.";
    recommendation.foodDrink = "A cold drink or casual meal would fit nicely.";
    recommendation.mood = "Comfortable and social.";
    return recommendation;
  }

  // FALLBACK / OTHER
  recommendation.summary =
    "Conditions are fairly neutral, so a flexible city plan makes sense.";
  recommendation.clothing =
    tempBand === "cold" || tempBand === "freezing"
      ? "Wear a jacket and layers."
      : tempBand === "warm" || tempBand === "hot"
        ? "Wear lighter clothes and stay comfortable."
        : "A light layer should be enough.";
  recommendation.activity =
    timeOfDay === "morning"
      ? "Good time for coffee, brunch, or a short walk."
      : timeOfDay === "afternoon"
        ? "Try exploring nearby places, cafés, or parks."
        : "Dinner, dessert, or a relaxed evening plan would work well.";
  recommendation.foodDrink =
    timeOfDay === "morning"
      ? "Coffee or breakfast would fit well."
      : "Pick something that matches whether you want a cozy or active outing.";
  recommendation.mood = "Flexible and adaptable.";

  return recommendation;
}
