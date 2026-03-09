import {
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatTime12Hour } from "../services/calendarUtils";

export default function PlannerEventCard({ event, onEdit, onDelete }) {
  async function handleDirections() {
    try {
      if (event.lat == null || event.lng == null) {
        Alert.alert(
          "No location",
          "This event does not have a saved location.",
        );
        return;
      }

      const url = `https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`;

      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Could not open directions.");
      }
    } catch (error) {
      Alert.alert("Directions failed", error.message);
    }
  }

  return (
    <View style={styles.card}>
      {event.photoUrl ? (
        <Image source={{ uri: event.photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.placeholderText}>No Photo</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.time}>{formatTime12Hour(event.time24)}</Text>
        <Text style={styles.title}>{event.title}</Text>

        {event.locationName ? (
          <Text style={styles.location}>{event.locationName}</Text>
        ) : null}

        {event.notes ? <Text style={styles.notes}>{event.notes}</Text> : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.directionsButton,
              !event.locationName && styles.disabledButton,
            ]}
            onPress={handleDirections}
            disabled={!event.locationName}
          >
            <Text style={styles.buttonText}>Directions</Text>
          </TouchableOpacity>

          <View style={styles.rightButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(event)}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(event.id)}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f4f4f4",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    gap: 12,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#ddd",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#666",
    fontSize: 11,
  },
  content: {
    flex: 1,
  },
  time: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
    fontWeight: "600",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },
  notes: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  rightButtons: {
    flexDirection: "row",
    gap: 8,
  },
  directionsButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButton: {
    backgroundColor: "#d9534f",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});
