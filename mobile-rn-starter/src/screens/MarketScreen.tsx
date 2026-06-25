import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Header } from "../components/Header";
import { PlantCard } from "../components/PlantCard";
import { Plant } from "../types";
import { colors, spacing } from "../theme";
import { marketPlants } from "../utils/plants";

type SortOption = "price_asc" | "price_desc" | "name" | "location" | "";

type Props = {
  plants: Plant[];
};

export function MarketScreen({ plants }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "for-sale" | "auction">("all");
  const [sortBy, setSortBy] = useState<SortOption>("");

  const displayedPlants = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = marketPlants(plants).filter((plant) => {
      const matchesSearch =
        plant.type.toLowerCase().includes(normalized) ||
        plant.subType.toLowerCase().includes(normalized) ||
        plant.location.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || plant.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price_asc") return a.currentPrice - b.currentPrice;
      if (sortBy === "price_desc") return b.currentPrice - a.currentPrice;
      if (sortBy === "name") return a.type.localeCompare(b.type, "he");
      if (sortBy === "location") return a.location.localeCompare(b.location, "he");
      return 0;
    });
  }, [plants, query, sortBy, statusFilter]);

  return (
    <View style={styles.screen}>
      <Header title="PlantMates" subtitle="שוק הצמחים של הקהילה" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          placeholder="חיפוש לפי צמח, זן או מיקום"
          placeholderTextColor={colors.stone400}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />

        <View style={styles.segmentRow}>
          {[
            ["all", "הכל"],
            ["for-sale", "מכירה"],
            ["auction", "מכרזים"],
          ].map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setStatusFilter(value as "all" | "for-sale" | "auction")}
              style={[styles.segment, statusFilter === value && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, statusFilter === value && styles.segmentTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.segmentRow}>
          {[
            ["", "מומלץ"],
            ["price_asc", "זול"],
            ["price_desc", "יקר"],
            ["name", "שם"],
            ["location", "עיר"],
          ].map(([value, label]) => (
            <Pressable
              key={value || "default"}
              onPress={() => setSortBy(value as SortOption)}
              style={[styles.smallSegment, sortBy === value && styles.segmentActive]}
            >
              <Text style={[styles.smallSegmentText, sortBy === value && styles.segmentTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {displayedPlants.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </ScrollView>
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
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.stone800,
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  segmentRow: {
    flexDirection: "row-reverse",
    gap: 8,
    marginBottom: 12,
  },
  segment: {
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  smallSegment: {
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 8,
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
  smallSegmentText: {
    color: colors.stone600,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  segmentTextActive: {
    color: "#fff",
  },
});
