import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function AddEventModal({
  visible,
  onClose,
  onSave,
  savedPlaces,
  editingEvent = null,
}) {
  const [title, setTitle] = useState("");
  const [time24, setTime24] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (visible && editingEvent) {
      setTitle(editingEvent.title || "");
      setTime24(editingEvent.time24 || "");
      setNotes(editingEvent.notes || "");
      setPhotoUrl(editingEvent.photoUrl || "");

      const matchedPlace = savedPlaces.find(
        (place) => place.name === editingEvent.locationName,
      );
      setSelectedPlace(matchedPlace || null);
      return;
    }

    if (visible && !editingEvent) {
      setTitle("");
      setTime24("");
      setNotes("");
      setSelectedPlace(null);
      setPhotoUrl("");
    }
  }, [visible, editingEvent, savedPlaces]);

  async function handlePickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Image error", error.message);
    }
  }

  async function handleTakePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission denied", "Camera access is required.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Camera error", error.message);
    }
  }

  function handleSavePress() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter an event title.");
      return;
    }

    if (!time24.trim()) {
      Alert.alert("Missing time", "Please enter a time like 09:00 or 18:30.");
      return;
    }

    onSave({
      id: editingEvent?.id || `${Date.now()}`,
      title: title.trim(),
      time24: time24.trim(),
      notes: notes.trim(),
      locationName: selectedPlace?.name || editingEvent?.locationName || "",
      lat: selectedPlace?.lat || editingEvent?.lat || null,
      lng: selectedPlace?.lng || editingEvent?.lng || null,
      photoUrl:
        photoUrl || selectedPlace?.photoUrl || editingEvent?.photoUrl || "",
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>
              {editingEvent ? "Edit Event" : "Add Event"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#777"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Time (HH:MM)"
              placeholderTextColor="#777"
              value={time24}
              onChangeText={(text) => {
                const digitsOnly = text.replace(/\D/g, "").slice(0, 4);

                if (digitsOnly.length <= 2) {
                  setTime24(digitsOnly);
                } else {
                  setTime24(`${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2)}`);
                }
              }}
              keyboardType="number-pad"
              maxLength={5}
            />

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes"
              placeholderTextColor="#777"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Text style={styles.sectionLabel}>Choose Saved Place</Text>

            <FlatList
              horizontal
              data={savedPlaces}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => {
                const isSelected = selectedPlace?.id === item.id;

                return (
                  <TouchableOpacity
                    style={[
                      styles.placeChip,
                      isSelected && styles.selectedPlaceChip,
                    ]}
                    onPress={() => setSelectedPlace(item)}
                  >
                    <Text
                      style={[
                        styles.placeChipText,
                        isSelected && styles.selectedPlaceChipText,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handlePickImage}
              >
                <Text style={styles.secondaryButtonText}>Pick Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleTakePhoto}
              >
                <Text style={styles.secondaryButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>

            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.previewImage} />
            ) : null}

            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSavePress}
              >
                <Text style={styles.saveButtonText}>
                  {editingEvent ? "Update Event" : "Save Event"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "90%",
    backgroundColor: "white",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f3f3f3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: "#222",
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  placeChip: {
    backgroundColor: "#ececec",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedPlaceChip: {
    backgroundColor: "#222",
  },
  placeChipText: {
    color: "#222",
    fontWeight: "600",
  },
  selectedPlaceChipText: {
    color: "white",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 14,
  },
  secondaryButton: {
    backgroundColor: "#ececec",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontWeight: "600",
    color: "#222",
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ececec",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#222",
    fontWeight: "700",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#222",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "700",
  },
});
