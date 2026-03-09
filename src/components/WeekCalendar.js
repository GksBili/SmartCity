import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getDayLabel,
  getMonthRangeLabel,
  isSameDay,
} from "../services/calendarUtils";

export default function WeekCalendar({
  weekDates,
  selectedDate,
  onSelectDate,
  onPreviousWeek,
  onNextWeek,
}) {
  const today = new Date();

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.weekButton} onPress={onPreviousWeek}>
          <Text style={styles.weekButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.rangeText}>{getMonthRangeLabel(weekDates)}</Text>

        <TouchableOpacity style={styles.weekButton} onPress={onNextWeek}>
          <Text style={styles.weekButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={weekDates}
        keyExtractor={(item) => item.toISOString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = isSameDay(item, selectedDate);
          const isToday = isSameDay(item, today);

          return (
            <TouchableOpacity
              style={[
                styles.dayCard,
                isSelected && styles.selectedDayCard,
                isToday && !isSelected && styles.todayCard,
              ]}
              onPress={() => onSelectDate(item)}
            >
              <Text style={[styles.dayName, isSelected && styles.selectedText]}>
                {getDayLabel(item)}
              </Text>
              <Text
                style={[styles.dayNumber, isSelected && styles.selectedText]}
              >
                {item.getDate()}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  weekButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  weekButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  rangeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  listContent: {
    gap: 10,
  },
  dayCard: {
    width: 68,
    backgroundColor: "#ececec",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  selectedDayCard: {
    backgroundColor: "#222",
  },
  todayCard: {
    borderWidth: 2,
    borderColor: "#222",
  },
  dayName: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontWeight: "600",
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },
  selectedText: {
    color: "white",
  },
});
