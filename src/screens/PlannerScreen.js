import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../components/ThemeContext";


import WeekCalendar from "../components/WeekCalendar";
import PlannerEventCard from "../components/PlannerEventCard";
import AddEventModal from "../components/AddEventModal";
import { Ionicons } from "@expo/vector-icons";
import {
  addWeeks,
  formatDateKey,
  getStartOfWeek,
  getWeekDates,
  sortEventsByTime,
} from "../services/calendarUtils";
import {
  addPlannerEvent,
  cacheWeekPlannerEntries,
  deletePlannerEvent,
  getCachedWeekPlannerEntries,
  getPlannerEntry,
  getSavedPlacesForPlanner,
  getWeekPlannerEntries,
  updateJournal,
  updatePlannerEvent,
} from "../services/plannerService";
import { fetchForecastForDate } from "../services/weatherService";
import { getRecommendation } from "../services/recommendationService";
import useLocation from "../hooks/useLocation";

export default function PlannerScreen() {
  const { theme } = useTheme(); 
  const { location } = useLocation();


  const [weekBaseDate, setWeekBaseDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekEntries, setWeekEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [weekSwitching, setWeekSwitching] = useState(false);
  const [dayEntry, setDayEntry] = useState(null);
  const [dayWeather, setDayWeather] = useState(null);
  const [journalText, setJournalText] = useState("");
  const [journalPhotos, setJournalPhotos] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [savingJournal, setSavingJournal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

 
  const weekDates = useMemo(() => getWeekDates(weekBaseDate), [weekBaseDate]);
  const selectedDateKey = formatDateKey(selectedDate);
  const hasLoadedInitially = useRef(false);
  const manualDateJumpRef = useRef(false);

 
  const isWeatherMode = theme === "weather";
  const themeStyles = isWeatherMode
    ? {
        screen: {}, 
        card: { backgroundColor: "#00aacd" },
        title: { color: "#222" },
        subtitle: { color: "#666" },
        bodyText: { color: "#fff" },
        inputText: { color: "#fff", backgroundColor: "rgba(255,255,255,0.15)" },
        button: { backgroundColor: "#003566" },
        emptyCard: { backgroundColor: "rgba(255,255,255,0.1)" }
      }
    : {
        screen: { backgroundColor: "#f7f7f7" },
        card: { backgroundColor: "white" },
        title: { color: "#222" },
        subtitle: { color: "#666" },
        bodyText: { color: "#333" },
        inputText: { color: "#222", backgroundColor: "#f3f3f3" },
        button: { backgroundColor: "#222" },
        emptyCard: { backgroundColor: "#ececec" }
      };

  
  useEffect(() => {
    async function loadWeekData() {
      try {
        if (!hasLoadedInitially.current) setLoading(true);
        else setWeekSwitching(true);

        const cached = await getCachedWeekPlannerEntries(weekDates);
        if (cached) setWeekEntries(cached);

        const fresh = await getWeekPlannerEntries(weekDates);
        setWeekEntries(fresh);
        await cacheWeekPlannerEntries(weekDates, fresh);
        hasLoadedInitially.current = true;
      } catch (error) {
        console.log("Planner week load error:", error.message);
      } finally {
        setLoading(false);
        setWeekSwitching(false);
      }
    }
    loadWeekData();
  }, [weekBaseDate]);

 
  useEffect(() => {
    async function loadDayData() {
      try {
        const entry = weekEntries[selectedDateKey] || (await getPlannerEntry(selectedDate));
        setDayEntry(entry);
        setJournalText(entry.journalText || "");
        setJournalPhotos(entry.journalPhotos || []);
      } catch (error) {
        console.log("Planner day load error:", error.message);
      }
    }
    loadDayData();
  }, [weekEntries, selectedDateKey, selectedDate]);

 
  useEffect(() => {
    async function loadWeatherForSelectedDay() {
      try {
        if (!location?.coords) {
          setDayWeather(null);
          return;
        }
        const forecast = await fetchForecastForDate(
          location.coords.latitude,
          location.coords.longitude,
          selectedDate
        );
        setDayWeather(forecast);
      } catch (error) {
        setDayWeather(null);
      }
    }
    loadWeatherForSelectedDay();
  }, [location, selectedDate]);


  const loadSavedPlaces = async () => {
    const places = await getSavedPlacesForPlanner();
    setSavedPlaces(places);
  };

  useFocusEffect(useCallback(() => { loadSavedPlaces(); }, []));



  const handleCalendarChange = (event, pickedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (!pickedDate) return;
    manualDateJumpRef.current = true;
    setSelectedDate(pickedDate);
    setWeekBaseDate(getStartOfWeek(pickedDate));
  };

  const handleAddOrUpdateEvent = async (event) => {
    try {
      const updated = editingEvent 
        ? await updatePlannerEvent(selectedDate, event) 
        : await addPlannerEvent(selectedDate, event);
      setWeekEntries(prev => ({ ...prev, [selectedDateKey]: updated }));
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const updated = await deletePlannerEvent(selectedDate, eventId);
      setWeekEntries(prev => ({ ...prev, [selectedDateKey]: updated }));
    } catch (error) {
      Alert.alert("Delete failed", error.message);
    }
  };

  const handleSaveJournal = async () => {
    try {
      setSavingJournal(true);
      const updated = await updateJournal(selectedDate, journalText, journalPhotos);
      setWeekEntries(prev => ({ ...prev, [selectedDateKey]: updated }));
      Alert.alert("Success", "Journal saved.");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSavingJournal(false);
    }
  };

  const handlePickJournalPhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setJournalPhotos(prev => [...prev, result.assets[0].uri]);
  };



  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} size="large" color={isWeatherMode ? "#fff" : "#000"} />;
  }

  const sortedEvents = sortEventsByTime(dayEntry?.events || []);
  const recommendation = dayWeather && selectedDate 
    ? getRecommendation(dayWeather.condition, dayWeather.temp, selectedDate) 
    : null;

  function renderContent() {
    return (
      <>
        {/* Header Section */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, themeStyles.title]}>Weekly Planner</Text>
            <Text style={[styles.selectedDateText, themeStyles.subtitle]}>
              {selectedDate.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
            </Text>
          </View>

          <View style={styles.titleActions}>
            {weekSwitching && <ActivityIndicator size="small" color={isWeatherMode ? "#fff" : "#000"} />}
            <TouchableOpacity 
            style={[styles.calendarButton, themeStyles.button]} 
            onPress={() => setShowDatePicker(true)}
            >
            <Ionicons name="calendar" size={24} color="white" />
          </TouchableOpacity>
          </View>

        </View>

        {/* Date Picker Overlay */}
        {showDatePicker && (
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleCalendarChange}
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity style={styles.closePickerButton} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.closePickerText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Week Selector */}
        <WeekCalendar
          weekDates={weekDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPreviousWeek={() => setWeekBaseDate(prev => addWeeks(prev, -1))}
          onNextWeek={() => setWeekBaseDate(prev => addWeeks(prev, 1))}
          theme={theme}
        />

        {/* Overview Card */}
        <View style={[styles.card, themeStyles.card]}>
          <Text style={[styles.cardTitle, themeStyles.title]}>Day Overview</Text>
          {dayWeather ? (
            <>
              <Text style={[styles.weatherLine, themeStyles.bodyText]}>
                {dayWeather.city} • {Math.round(dayWeather.temp)}°C • {dayWeather.condition}
              </Text>
              <Text style={[styles.description, themeStyles.subtitle]}>{dayWeather.description}</Text>
            </>
          ) : (
            <Text style={[styles.description, themeStyles.subtitle]}>Weather info unavailable.</Text>
          )}

          {recommendation && (
            <View style={styles.recommendationBox}>
              <Text style={[styles.sectionLabel, themeStyles.title]}>Clothing</Text>
              <Text style={[styles.bodyText, themeStyles.bodyText]}>{recommendation.clothing}</Text>
              <Text style={[styles.sectionLabel, themeStyles.title]}>Activity</Text>
              <Text style={[styles.bodyText, themeStyles.bodyText]}>{recommendation.activity}</Text>
            </View>
          )}
        </View>

        {/* Timeline Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, themeStyles.title]}>Daily Timeline</Text>
          <TouchableOpacity 
            style={[styles.addButton, themeStyles.button]} 
            onPress={() => { setEditingEvent(null); setModalVisible(true); }}
          >
            <Text style={styles.addButtonText}>+ Add Event</Text>
          </TouchableOpacity>
        </View>

        {sortedEvents.length > 0 ? (
          sortedEvents.map(event => (
            <PlannerEventCard
              key={event.id}
              event={event}
              theme={theme}
              onEdit={(item) => { setEditingEvent(item); setModalVisible(true); }}
              onDelete={handleDeleteEvent}
            />
          ))
        ) : (
          <View style={[styles.emptyCard, themeStyles.emptyCard]}>
            <Text style={[styles.emptyText, themeStyles.subtitle]}>Nothing planned for today.</Text>
          </View>
        )}

        {/* Journal Section */}
        <View style={[styles.card, themeStyles.card]}>
          <Text style={[styles.cardTitle, themeStyles.title]}>Daily Journal</Text>
          <TextInput
            style={[styles.journalInput, themeStyles.inputText]}
            placeholder="How was your day?"
            placeholderTextColor={isWeatherMode ? "#fff" : "#777"}
            multiline
            value={journalText}
            onChangeText={setJournalText}
          />
          <View style={styles.journalButtonRow}>
            <TouchableOpacity style={[styles.secondaryButton, isWeatherMode && {backgroundColor: "rgba(255,255,255,0.2)"}]} onPress={handlePickJournalPhoto}>
              <Text style={[styles.secondaryButtonText, isWeatherMode && {color: "#fff"}]}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveJournalButton, themeStyles.button, {flex: 1, marginTop: 0}]} onPress={handleSaveJournal} disabled={savingJournal}>
              <Text style={styles.saveJournalButtonText}>{savingJournal ? "Saving..." : "Save Journal"}</Text>
            </TouchableOpacity>
          </View>
          
          {journalPhotos.length > 0 && (
            <FlatList
              horizontal
              data={journalPhotos}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, marginTop: 12 }}
              renderItem={({ item }) => <Image source={{ uri: item }} style={styles.journalPhoto} />}
            />
          )}
        </View>
      </>
    );
  }


  const MainContainer = isWeatherMode ? LinearGradient : View;
  const containerProps = isWeatherMode 
    ? { colors: ['#b1e6f7', "#019cf0"], style: styles.root } 
    : { style: [styles.root, themeStyles.screen] };

  return (
    <MainContainer {...containerProps}>
      <ScrollView 
        style={styles.root} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      <AddEventModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingEvent(null); }}
        onSave={handleAddOrUpdateEvent}
        savedPlaces={savedPlaces}
        editingEvent={editingEvent}
        theme={theme}
      />
    </MainContainer>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  selectedDateText: {
    fontSize: 15,
    marginTop: 4,
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calendarIcon: {
    width: 26,
    height: 26,
    tintColor: "white",
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  weatherLine: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    textTransform: "capitalize",
    opacity: 0.8,
  },
  recommendationBox: {
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 15,
  },
  journalInput: {
    minHeight: 100,
    borderRadius: 15,
    padding: 15,
    fontSize: 15,
    textAlignVertical: "top",
    marginBottom: 15,
  },
  journalButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 15,
    borderRadius: 12,
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
    color: "#333",
  },
  saveJournalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveJournalButtonText: {
    color: "white",
    fontWeight: "700",
  },
  journalPhoto: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  datePickerOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    zIndex: 999,
  },
  datePickerContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  closePickerButton: {
    marginTop: 15,
    backgroundColor: "#222",
    width: "100%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closePickerText: {
    color: "white",
    fontWeight: "700",
  },
});