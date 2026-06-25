import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Header } from "../components/Header";
import { Plant, PlantStatus, TabKey } from "../types";
import { colors, spacing } from "../theme";

type Props = {
  onCreate: (plant: Plant) => void;
  onNavigate: (tab: TabKey) => void;
};

const defaultImage = "https://images.unsplash.com/photo-1463320726281-696a485928c7?q=80&w=900&auto=format&fit=crop";

export function NewPlantScreen({ onCreate, onNavigate }: Props) {
  const [type, setType] = useState("");
  const [subType, setSubType] = useState("");
  const [price, setPrice] = useState("120");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<PlantStatus>("personal");

  const createPlant = () => {
    if (!type.trim()) return;
    onCreate({
      id: `local-${Date.now()}`,
      type: type.trim(),
      subType: subType.trim() || "זן חדש",
      status,
      estimatedValue: Number(price) || 0,
      currentPrice: Number(price) || 0,
      location: location.trim() || "לא צוין",
      imageUrl: defaultImage,
      sellerName: "אני",
      wateringDate: Date.now(),
      size: "M",
      listingId: status === "personal" ? undefined : `listing-local-${Date.now()}`,
      auctionEndTime: status === "auction" ? Date.now() + 3600000 * 6 : undefined,
      care: {
        lightNeeds: "אור חזק לא ישיר",
        wateringFrequency: 7,
        humidityLevel: 50,
        soilType: "מצע מנוקז",
        careTips: ["להוסיף תמונה אמיתית בשלב הבא", "לעדכן מדריך טיפול אחרי זיהוי הצמח"],
      },
    });
    setType("");
    setSubType("");
    setPrice("120");
    setLocation("");
    setStatus("personal");
    onNavigate(status === "personal" ? "collection" : status === "auction" ? "auctions" : "shop");
  };

  return (
    <View style={styles.screen}>
      <Header title="הוספת צמח" subtitle="טופס ראשוני מקביל למסך /new באתר" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="שם הצמח" value={type} onChangeText={setType} placeholder="לדוגמה: פוטוס" />
        <Input label="זן / תת סוג" value={subType} onChangeText={setSubType} placeholder="לדוגמה: זהב" />
        <Input label="מחיר משוער" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="120" />
        <Input label="מיקום בבית" value={location} onChangeText={setLocation} placeholder="לדוגמה: סלון, מרפסת, חדר שינה" />

        <Text style={styles.label}>סטטוס</Text>
        <View style={styles.segmentRow}>
          {[
            ["personal", "לאוסף"],
            ["for-sale", "למכירה"],
            ["auction", "מכרז"],
          ].map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setStatus(value as PlantStatus)}
              style={[styles.segment, status === value && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, status === value && styles.segmentTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.submit, !type.trim() && styles.submitDisabled]} onPress={createPlant}>
          <Text style={styles.submitText}>הוסף צמח</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
};

function Input({ label, value, onChangeText, placeholder, keyboardType = "default" }: InputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.stone400}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: spacing.screen,
    paddingBottom: 120,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: colors.stone600,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
    textAlign: "right",
    writingDirection: "rtl",
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.stone800,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  segmentRow: {
    flexDirection: "row-reverse",
    gap: 8,
    marginBottom: 24,
  },
  segment: {
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  segmentActive: {
    backgroundColor: colors.emerald700,
    borderColor: colors.emerald700,
  },
  segmentText: {
    color: colors.stone600,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  segmentTextActive: {
    color: "#fff",
  },
  submit: {
    backgroundColor: colors.emerald800,
    borderRadius: 16,
    paddingVertical: 16,
  },
  submitDisabled: {
    opacity: 0.45,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
});
