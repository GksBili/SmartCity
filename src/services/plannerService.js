import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { formatDateKey } from "./calendarUtils";
import { getSavedPlaces } from "./savedPlacesService";

const CACHE_PREFIX = "planner_week_cache";

function getPlannerDocId(uid, dateKey) {
  return `${uid}_${dateKey}`;
}

export async function getPlannerEntry(date) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No logged in user");

  const dateKey = typeof date === "string" ? date : formatDateKey(date);
  const ref = doc(db, "plannerEntries", getPlannerDocId(uid, dateKey));
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return {
      userId: uid,
      date: dateKey,
      events: [],
      journalText: "",
      journalPhotos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return snapshot.data();
}

export async function savePlannerEntry(date, partialEntry) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No logged in user");

  const dateKey = typeof date === "string" ? date : formatDateKey(date);
  const ref = doc(db, "plannerEntries", getPlannerDocId(uid, dateKey));

  const existing = await getPlannerEntry(dateKey);

  const merged = {
    ...existing,
    ...partialEntry,
    userId: uid,
    date: dateKey,
    updatedAt: new Date().toISOString(),
    createdAt: existing.createdAt || new Date().toISOString(),
  };

  await setDoc(ref, merged);
  return merged;
}

export async function addPlannerEvent(date, event) {
  const existing = await getPlannerEntry(date);
  const updatedEvents = [...(existing.events || []), event];

  return await savePlannerEntry(date, {
    events: updatedEvents,
  });
}

export async function updatePlannerEvent(date, updatedEvent) {
  const existing = await getPlannerEntry(date);

  const updatedEvents = (existing.events || []).map((event) =>
    event.id === updatedEvent.id ? updatedEvent : event,
  );

  return await savePlannerEntry(date, {
    events: updatedEvents,
  });
}

export async function deletePlannerEvent(date, eventId) {
  const existing = await getPlannerEntry(date);

  const updatedEvents = (existing.events || []).filter(
    (event) => event.id !== eventId,
  );

  return await savePlannerEntry(date, {
    events: updatedEvents,
  });
}

export async function updateJournal(date, journalText, journalPhotos) {
  return await savePlannerEntry(date, {
    journalText,
    journalPhotos,
  });
}

export async function getWeekPlannerEntries(weekDates) {
  const results = {};

  for (const d of weekDates) {
    const key = formatDateKey(d);
    const entry = await getPlannerEntry(key);
    results[key] = entry;
  }

  return results;
}

export async function cacheWeekPlannerEntries(weekDates, data) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const cacheKey = `${CACHE_PREFIX}_${uid}_${formatDateKey(weekDates[0])}`;
  await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
}

export async function getCachedWeekPlannerEntries(weekDates) {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const cacheKey = `${CACHE_PREFIX}_${uid}_${formatDateKey(weekDates[0])}`;
  const raw = await AsyncStorage.getItem(cacheKey);
  return raw ? JSON.parse(raw) : null;
}

export async function getSavedPlacesForPlanner() {
  return await getSavedPlaces();
}
