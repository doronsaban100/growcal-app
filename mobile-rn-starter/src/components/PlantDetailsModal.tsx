import React from "react";
import { Modal, ScrollView, StyleSheet, Text, Pressable, View, Image, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Plant } from "../types";
import { colors } from "../theme";
import { daysSince, formatCurrency, getAverageNurseryPrice, lightIcon } from "../utils/plants";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  visible: boolean;
  plant: Plant | null;
  onClose: () => void;
  onWater?: (id: string) => void;
};

export function PlantDetailsModal({ visible, plant, onClose, onWater }: Props) {
  if (!plant) return null;

  const nurseryPrice = getAverageNurseryPrice(plant.type, plant.size);
  const isCollectionPlant = plant.status === "personal" || plant.status === "collection";

  const wateredDaysAgo = daysSince(plant.wateringDate);
  const wateringFrequency = plant.care.wateringFrequency || 7;
  const moisturePercent = Math.max(
    0,
    Math.min(100, Math.round(((wateringFrequency - wateredDaysAgo) / wateringFrequency) * 100))
  );

  let moistureColor = "#059669";
  if (moisturePercent < 30) {
    moistureColor = "#dc2626";
  } else if (moisturePercent < 60) {
    moistureColor = "#d97706";
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Top handle bar */}
          <View style={styles.handle} />
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header info */}
            <View style={styles.header}>
              <Image source={{ uri: plant.imageUrl }} style={styles.image} />
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{plant.type}</Text>
                <Text style={styles.subTitle}>{plant.subType}</Text>
                <View style={styles.tagRow}>
                  <Text style={styles.tag}>{plant.location}</Text>
                  <Text style={styles.tag}>מידה {plant.size}</Text>
                </View>
              </View>
            </View>

            {/* Moisture level details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>מצב השקיה נוכחי</Text>
              <View style={styles.moistureBox}>
                <View style={styles.moistureRow}>
                  <Text style={styles.moistureText}>
                    הושקה לפני {wateredDaysAgo === 0 ? "היום" : `${wateredDaysAgo} ימים`} (כל {wateringFrequency} ימים)
                  </Text>
                  <Text style={[styles.moisturePercent, { color: moistureColor }]}>{moisturePercent}% לחות</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${moisturePercent}%`, backgroundColor: moistureColor }]} />
                </View>
              </View>
            </View>

            {/* Care grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>מדריך טיפול מהיר</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Ionicons name="sunny-outline" size={24} color={colors.amber700} />
                  <Text style={styles.gridLabel}>אור נדרש</Text>
                  <Text style={styles.gridValue}>{plant.care.lightNeeds}</Text>
                </View>

                <View style={styles.gridItem}>
                  <Ionicons name="water-outline" size={24} color={colors.emerald600} />
                  <Text style={styles.gridLabel}>תדירות מים</Text>
                  <Text style={styles.gridValue}>כל {wateringFrequency} ימים</Text>
                </View>

                <View style={styles.gridItem}>
                  <Ionicons name="thermometer-outline" size={24} color={colors.stone600} />
                  <Text style={styles.gridLabel}>מצע אדמה</Text>
                  <Text style={styles.gridValue}>{plant.care.soilType || "מצע רגיל"}</Text>
                </View>

                <View style={styles.gridItem}>
                  <Ionicons name="water" size={24} color="#0284c7" />
                  <Text style={styles.gridLabel}>לחות סביבה</Text>
                  <Text style={styles.gridValue}>
                    {plant.care.humidityLevel ? `${plant.care.humidityLevel}%` : "ללא דרישה"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Care Tips */}
            {plant.care.careTips && plant.care.careTips.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>טיפים מנצחים לגידול</Text>
                {plant.care.careTips.map((tip, idx) => (
                  <View key={idx} style={styles.tipRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.emerald700} style={styles.tipIcon} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Financial summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>פרטים כלליים</Text>
              <View style={styles.detailsRow}>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>
                    {isCollectionPlant ? "שווי (ממוצע משתלות)" : "שווי מוערך"}
                  </Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(isCollectionPlant ? nurseryPrice : (plant.estimatedValue || plant.currentPrice))}
                  </Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>מטפל אחראי</Text>
                  <Text style={styles.detailValue}>{plant.sellerName || "אני"}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom actions */}
          <View style={styles.footer}>
            {onWater && (
              <Pressable
                style={styles.waterBtn}
                onPress={() => {
                  onWater(plant.id);
                }}
              >
                <Ionicons name="water-outline" size={18} color="#fff" />
                <Text style={styles.waterBtnText}>השקיתי עכשיו</Text>
              </Pressable>
            )}
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>סגור</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: colors.stone200,
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: colors.stone100,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.stone800,
    textAlign: "right",
  },
  subTitle: {
    fontSize: 16,
    color: colors.stone500,
    marginTop: 2,
    textAlign: "right",
  },
  tagRow: {
    flexDirection: "row-reverse",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.stone100,
    color: colors.stone600,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.stone800,
    marginBottom: 10,
    textAlign: "right",
  },
  moistureBox: {
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  moistureRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  moistureText: {
    fontSize: 12,
    color: colors.stone600,
    fontWeight: "600",
  },
  moisturePercent: {
    fontSize: 13,
    fontWeight: "800",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.stone200,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "48%",
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  gridLabel: {
    fontSize: 11,
    color: colors.stone500,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.stone800,
    textAlign: "center",
  },
  tipRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    fontSize: 13,
    color: colors.stone600,
    lineHeight: 18,
    flex: 1,
    textAlign: "right",
  },
  detailsRow: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  detailBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    color: colors.stone500,
    fontWeight: "700",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.emerald800,
  },
  footer: {
    flexDirection: "row-reverse",
    padding: 20,
    gap: 10,
    borderTopColor: colors.stone200,
    borderTopWidth: 1,
    backgroundColor: colors.surface,
  },
  waterBtn: {
    flex: 1,
    backgroundColor: colors.emerald600,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  waterBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  closeBtn: {
    flex: 1,
    backgroundColor: colors.stone100,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: colors.stone600,
    fontSize: 14,
    fontWeight: "800",
  },
});
