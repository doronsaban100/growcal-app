import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "../components/EmptyState";
import { Header } from "../components/Header";
import { PlantCard } from "../components/PlantCard";
import { Plant, PlantStatus } from "../types";
import { colors, spacing } from "../theme";
import { daysSince, formatCurrency, getAverageNurseryPrice } from "../utils/plants";
import { PlantDetailsModal } from "../components/PlantDetailsModal";

type Props = {
  title: string;
  subtitle: string;
  emptyIcon: string;
  emptyTitle: string;
  emptyDescription: string;
  plants: Plant[];
  editable?: boolean;
  onWater?: (id: string) => void;
  onStatusChange?: (id: string, status: PlantStatus) => void;
  onPriceChange?: (id: string, price: number) => void;
};

export function InventoryScreen({
  title,
  subtitle,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  plants,
  editable,
  onWater,
  onStatusChange,
  onPriceChange,
}: Props) {
  const isCollection = title.includes("אוסף");
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  
  // Sorting and Filtering State
  const [sortBy, setSortBy] = useState<string>("default");
  const [selectedLocation, setSelectedLocation] = useState<string>("הכול");

  const totalCount = plants.length;
  const totalValue = plants.reduce((sum, p) => {
    const price = isCollection
      ? getAverageNurseryPrice(p.type, p.size)
      : (p.estimatedValue || p.currentPrice || 0);
    return sum + price;
  }, 0);
  const thirstyCount = plants.filter(
    (plant) => daysSince(plant.wateringDate) >= plant.care.wateringFrequency
  ).length;

  const selectedPlant = plants.find((p) => p.id === selectedPlantId) || null;

  // Extract unique locations dynamically
  const locations = ["הכול", ...Array.from(new Set(plants.map((p) => p.location || "לא צוין")))];

  // Filter and Sort plants
  let processedPlants = plants.filter((plant) => {
    if (selectedLocation === "הכול") return true;
    return plant.location === selectedLocation;
  });

  if (sortBy === "thirsty") {
    processedPlants = [...processedPlants].sort((a, b) => {
      const urgencyA = daysSince(a.wateringDate) - (a.care.wateringFrequency || 7);
      const urgencyB = daysSince(b.wateringDate) - (b.care.wateringFrequency || 7);
      return urgencyB - urgencyA; // Thirsty first
    });
  } else if (sortBy === "value") {
    processedPlants = [...processedPlants].sort((a, b) => {
      const valA = a.estimatedValue || a.currentPrice || 0;
      const valB = b.estimatedValue || b.currentPrice || 0;
      return valB - valA; // High to low
    });
  }

  return (
    <View style={styles.screen}>
      <Header title={title} subtitle={subtitle} />

      {totalCount > 0 && (
        <>
          <View style={styles.dashboard}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalCount}</Text>
              <Text style={styles.statLabel}>{isCollection ? "צמחים באוסף" : "פריטים בחנות"}</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: colors.emerald800 }]}>
                {formatCurrency(totalValue)}
              </Text>
              <Text style={styles.statLabel}>שווי מוערך</Text>
            </View>
            
            {isCollection ? (
              <View style={[styles.statCard, thirstyCount > 0 && styles.thirstyCard]}>
                <Text style={[styles.statNumber, thirstyCount > 0 ? styles.thirstyNumber : { color: colors.stone800 }]}>
                  {thirstyCount}
                </Text>
                <Text style={styles.statLabel}>{thirstyCount === 1 ? "צמח צמא" : "צמחים צמאים"}</Text>
              </View>
            ) : (
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: colors.amber700 }]}>
                  {plants.filter(p => p.status === "auction").length}
                </Text>
                <Text style={styles.statLabel}>במכרזים</Text>
              </View>
            )}
          </View>

          {/* Filtering and Sorting Controls */}
          <View style={styles.controlsContainer}>
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>מיון:</Text>
              <View style={styles.chipsRow}>
                {[
                  { key: "default", label: "רגיל" },
                  { key: "thirsty", label: "צמאים קודם" },
                  { key: "value", label: "לפי שווי" },
                ].map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setSortBy(opt.key)}
                    style={[styles.chip, sortBy === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, sortBy === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>מיקום:</Text>
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollChips}
              >
                {locations.map((loc) => (
                  <Pressable
                    key={loc}
                    onPress={() => setSelectedLocation(loc)}
                    style={[styles.chip, selectedLocation === loc && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selectedLocation === loc && styles.chipTextActive]}>
                      {loc}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </>
      )}

      <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled>
        {processedPlants.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={totalCount > 0 ? "לא נמצאו תוצאות לסינון" : emptyTitle}
            description={totalCount > 0 ? "נסה לשנות את המיקום שנבחר." : emptyDescription}
          />
        ) : (
          processedPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              editable={editable}
              onWater={onWater}
              onStatusChange={onStatusChange}
              onPriceChange={onPriceChange}
              onPress={() => setSelectedPlantId(plant.id)}
            />
          ))
        )}
      </ScrollView>

      <PlantDetailsModal
        visible={!!selectedPlantId}
        plant={selectedPlant}
        onClose={() => setSelectedPlantId(null)}
        onWater={onWater}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  dashboard: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screen,
    paddingTop: 10,
    paddingBottom: 5,
    gap: 10,
  },
  controlsContainer: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.stone200,
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.screen,
    gap: 10,
  },
  controlRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.stone600,
    minWidth: 45,
    textAlign: "right",
  },
  chipsRow: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  scrollChips: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  chip: {
    backgroundColor: colors.stone100,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.stone200,
  },
  chipActive: {
    backgroundColor: colors.emerald50,
    borderColor: colors.emerald600,
  },
  chipText: {
    fontSize: 12,
    color: colors.stone600,
    fontWeight: "700",
  },
  chipTextActive: {
    color: colors.emerald800,
    fontWeight: "800",
  },
  statCard: {
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  thirstyCard: {
    backgroundColor: colors.red50,
    borderColor: colors.red100,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.stone800,
  },
  thirstyNumber: {
    color: colors.red700,
  },
  statLabel: {
    fontSize: 11,
    color: colors.stone500,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  content: {
    padding: spacing.screen,
    paddingBottom: 120,
  },
});
