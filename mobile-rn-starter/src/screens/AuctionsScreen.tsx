import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "../components/Header";
import { Plant } from "../types";
import { colors, spacing } from "../theme";

type Props = {
  plants: Plant[];
  onBid: (id: string) => void;
};

const CURRENT_USER_COUNT = 47; // ניתן לחבר עתידית ל-Convex
const REQUIRED_USER_COUNT = 5000;

export function AuctionsScreen({ plants: _plants, onBid: _onBid }: Props) {
  const progressPercent = Math.min(100, Math.round((CURRENT_USER_COUNT / REQUIRED_USER_COUNT) * 100));

  return (
    <View style={styles.screen}>
      <Header title="מכרזים" subtitle="מכירות פומביות בקהילת PlantMates" />
      <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>

        {/* Lock icon with glow */}
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={44} color={colors.emerald700} />
        </View>

        <Text style={styles.title}>המכרזים בדרך! 🌱</Text>
        <Text style={styles.subtitle}>
          אנחנו מכינים לך חוויית מכרז מרגשת, אבל רוצים שתהיה קהילה שתשתתף בה.
        </Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>התקדמות הקהילה</Text>
            <Text style={styles.progressCount}>
              <Text style={styles.progressCurrentCount}>{CURRENT_USER_COUNT}</Text>
              <Text style={styles.progressDivider}> / {REQUIRED_USER_COUNT} משתמשים</Text>
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }]} />
          </View>
          <Text style={styles.progressNote}>
            עוד {REQUIRED_USER_COUNT - CURRENT_USER_COUNT} משתמשים ונפתח את המכרזים 🎉
          </Text>
        </View>

        {/* Feature preview cards */}
        <View style={styles.featuresGrid}>
          {[
            { icon: "hammer-outline" as const, title: "הצעות בזמן אמת", desc: "הצע מחיר ועדכן את כולם בשנייה" },
            { icon: "timer-outline" as const, title: "מכרזים מוגבלים בזמן", desc: "מתח מרגש עד הדקה האחרונה" },
            { icon: "ribbon-outline" as const, title: "צמחים נדירים", desc: "זנים שאי אפשר למצוא בשוק הרגיל" },
          ].map((feat) => (
            <View key={feat.title} style={styles.featureCard}>
              <Ionicons name={feat.icon} size={22} color={colors.emerald700} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  center: {
    alignItems: "center",
    paddingHorizontal: spacing.screen,
    paddingTop: 32,
    paddingBottom: 120,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.emerald50,
    borderWidth: 2,
    borderColor: colors.emerald100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    shadowColor: colors.emerald700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.stone800,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.stone500,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    writingDirection: "rtl",
    marginBottom: 28,
  },
  progressContainer: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.stone200,
    padding: 16,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.stone600,
    textAlign: "right",
  },
  progressCount: {
    flexDirection: "row",
  },
  progressCurrentCount: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.emerald700,
  },
  progressDivider: {
    fontSize: 13,
    color: colors.stone400,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.stone100,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: colors.emerald600,
  },
  progressNote: {
    fontSize: 12,
    color: colors.stone500,
    textAlign: "center",
    writingDirection: "rtl",
    fontWeight: "600",
  },
  featuresGrid: {
    width: "100%",
    gap: 12,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.stone200,
    padding: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  featureText: {
    flex: 1,
    gap: 3,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.stone800,
    textAlign: "right",
  },
  featureDesc: {
    fontSize: 12,
    color: colors.stone500,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
