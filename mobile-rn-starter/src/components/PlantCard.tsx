import React from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Plant, PlantStatus } from "../types";
import { colors } from "../theme";
import { daysSince, formatCurrency, getAverageNurseryPrice, lightIcon, statusLabel, wateringTone } from "../utils/plants";

type Props = {
  plant: Plant;
  editable?: boolean;
  auction?: boolean;
  timeLeft?: string;
  onWater?: (id: string) => void;
  onStatusChange?: (id: string, status: PlantStatus) => void;
  onPriceChange?: (id: string, price: number) => void;
  onBid?: (id: string) => void;
  onPress?: () => void;
};

export function PlantCard({
  plant,
  editable,
  auction,
  timeLeft,
  onWater,
  onStatusChange,
  onPriceChange,
  onBid,
  onPress,
}: Props) {
  const tone = wateringTone(plant.care.wateringFrequency);
  const wateredDaysAgo = daysSince(plant.wateringDate);

  const wateringFrequency = plant.care.wateringFrequency || 7;
  const moisturePercent = Math.max(
    0,
    Math.min(100, Math.round(((wateringFrequency - wateredDaysAgo) / wateringFrequency) * 100))
  );

  let moistureColor = "#059669"; // Emerald for well-watered
  if (moisturePercent < 30) {
    moistureColor = "#dc2626"; // Red for thirsty
  } else if (moisturePercent < 60) {
    moistureColor = "#d97706"; // Amber for medium moisture
  }

  const nurseryPrice = getAverageNurseryPrice(plant.type, plant.size);
  const isCollectionPlant = plant.status === "personal" || plant.status === "collection";

  return (
    <View style={[styles.card, auction && styles.auctionCard]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.topRow,
          pressed && onPress && { opacity: 0.7 }
        ]}
      >
        <Image source={{ uri: plant.imageUrl }} style={styles.image} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            {auction ? <Text style={styles.liveBadge}>Live</Text> : null}
            <Text style={styles.title}>{plant.type}</Text>
          </View>
          <Text style={styles.subTitle}>{plant.subType}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.status}>{statusLabel(plant.status)}</Text>
            <Text style={styles.location}>{plant.location}</Text>
          </View>
          
          <View style={[styles.carePill, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
            <Text style={[styles.careText, { color: tone.color }]}>
              {lightIcon(plant.care.lightNeeds)}  מים כל {plant.care.wateringFrequency} ימים
              {wateredDaysAgo === 0 ? " · הושקה היום" : ` · לפני ${wateredDaysAgo} ימים`}
            </Text>
          </View>

          <View style={styles.moistureSection}>
            <View style={styles.moistureTextRow}>
              <Text style={styles.moistureLabel}>לחות אדמה מוערכת:</Text>
              <Text style={[styles.moistureValue, { color: moistureColor }]}>{moisturePercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${moisturePercent}%`, backgroundColor: moistureColor }]} />
            </View>
          </View>
        </View>
      </Pressable>

      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>
            {auction ? "הצעה נוכחית" : isCollectionPlant ? "ממוצע משתלות" : "מחיר"}
          </Text>
          {isCollectionPlant ? (
            <Text style={styles.price}>{formatCurrency(nurseryPrice)}</Text>
          ) : editable ? (
            <TextInput
              defaultValue={String(plant.currentPrice)}
              keyboardType="numeric"
              onEndEditing={(event) => onPriceChange?.(plant.id, Number(event.nativeEvent.text) || plant.currentPrice)}
              style={styles.priceInput}
            />
          ) : (
            <Text style={styles.price}>{formatCurrency(plant.currentPrice)}</Text>
          )}
        </View>

        {auction ? (
          <Pressable style={styles.bidButton} onPress={() => onBid?.(plant.id)}>
            <Text style={styles.bidText}>הצע {formatCurrency(plant.currentPrice + 10)}</Text>
            {timeLeft ? <Text style={styles.timer}>{timeLeft}</Text> : null}
          </Pressable>
        ) : editable ? (
          <View style={styles.actions}>
            <Pressable style={styles.waterButton} onPress={() => onWater?.(plant.id)}>
              <Ionicons name="water-outline" size={16} color="#fff" />
              <Text style={styles.waterText}>השקיתי</Text>
            </Pressable>
            <View style={styles.statusButtons}>
              {(["personal", "for-sale", "auction"] as PlantStatus[]).map((status) => {
                const isAuction = status === "auction";
                const isActive = plant.status === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => !isAuction && onStatusChange?.(plant.id, status)}
                    style={[
                      styles.statusButton,
                      isActive && !isAuction && styles.statusButtonActive,
                      isAuction && styles.statusButtonLocked,
                    ]}
                  >
                    {isAuction && (
                      <Ionicons name="lock-closed" size={9} color={colors.stone400} />
                    )}
                    <Text style={[
                      styles.statusButtonText,
                      isActive && !isAuction && styles.statusButtonTextActive,
                      isAuction && styles.statusButtonTextLocked,
                    ]}>
                      {statusLabel(status)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <Ionicons name="chevron-back" size={20} color={colors.stone400} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  auctionCard: {
    backgroundColor: colors.amber50,
    borderColor: colors.amber200,
  },
  topRow: {
    flexDirection: "row-reverse",
    gap: 14,
  },
  image: {
    backgroundColor: colors.stone100,
    borderRadius: 14,
    height: 82,
    width: 82,
  },
  moistureSection: {
    marginTop: 10,
    width: "100%",
  },
  moistureTextRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  moistureLabel: {
    fontSize: 11,
    color: colors.stone500,
    fontWeight: "600",
  },
  moistureValue: {
    fontSize: 11,
    fontWeight: "800",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.stone200,
    borderRadius: 3,
    overflow: "hidden",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: colors.stone800,
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "right",
    writingDirection: "rtl",
  },
  subTitle: {
    color: colors.stone500,
    fontSize: 14,
    marginTop: 2,
    textAlign: "right",
    writingDirection: "rtl",
  },
  liveBadge: {
    backgroundColor: colors.amber200,
    borderRadius: 999,
    color: colors.amber700,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row-reverse",
    gap: 8,
    marginTop: 8,
  },
  status: {
    backgroundColor: colors.emerald100,
    borderRadius: 999,
    color: colors.emerald800,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  location: {
    color: colors.stone500,
    fontSize: 12,
    paddingVertical: 3,
    writingDirection: "rtl",
  },
  carePill: {
    alignSelf: "flex-end",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  careText: {
    fontSize: 11,
    fontWeight: "700",
    writingDirection: "rtl",
  },
  footer: {
    alignItems: "center",
    borderTopColor: colors.stone200,
    borderTopWidth: 1,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
  },
  priceLabel: {
    color: colors.stone500,
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
  },
  price: {
    color: colors.emerald800,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right",
  },
  priceInput: {
    backgroundColor: colors.surface,
    borderColor: colors.emerald100,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.emerald800,
    fontSize: 16,
    fontWeight: "900",
    minWidth: 82,
    paddingHorizontal: 10,
    paddingVertical: 4,
    textAlign: "right",
  },
  actions: {
    alignItems: "flex-end",
    gap: 8,
  },
  waterButton: {
    alignItems: "center",
    backgroundColor: colors.emerald600,
    borderRadius: 12,
    flexDirection: "row-reverse",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  waterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  statusButtons: {
    flexDirection: "row-reverse",
    gap: 5,
  },
  statusButton: {
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  statusButtonActive: {
    backgroundColor: colors.emerald700,
    borderColor: colors.emerald700,
  },
  statusButtonLocked: {
    backgroundColor: colors.stone100,
    borderColor: colors.stone200,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    opacity: 0.6,
  },
  statusButtonText: {
    color: colors.stone600,
    fontSize: 10,
    fontWeight: "800",
  },
  statusButtonTextActive: {
    color: "#fff",
  },
  statusButtonTextLocked: {
    color: colors.stone400,
  },
  bidButton: {
    alignItems: "center",
    backgroundColor: colors.amber600,
    borderRadius: 14,
    minWidth: 116,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bidText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    writingDirection: "rtl",
  },
  timer: {
    color: colors.amber100,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    marginTop: 2,
  },
});
