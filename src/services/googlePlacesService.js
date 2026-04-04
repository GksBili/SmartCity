const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

export function buildPlacePhotoUrl(photoName) {
  if (!photoName) return null;

  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_PLACES_API_KEY}`;
}

export async function fetchNearbyGooglePlaces(lat, lng) {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.location",
          "places.primaryType",
          "places.photos",
          "places.rating",
          "places.userRatingCount",
        ].join(","),
      },
      body: JSON.stringify({
        includedTypes: [
          "restaurant",
          "cafe",
          "park",
          "tourist_attraction",
          "museum",
          "movie_theater",
          "art_gallery",
          "zoo",
          "botanical_garden",
          "amusement_park",
          "night_club",
          "live_music_venue",
        ],
        maxResultCount: 12,
        rankPreference: "POPULARITY",
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng,
            },
            radius: 1000,
          },
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to fetch nearby places.");
  }

  return (data.places || []).map((place) => ({
    id: place.id,
    placeId: place.id,
    name: place.displayName?.text || "Unnamed place",
    address: place.formattedAddress || "No address available",
    category: place.primaryType || "place",
    lat: place.location?.latitude,
    lng: place.location?.longitude,
    photoName: place.photos?.[0]?.name || null,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? 0,
  }));
}
