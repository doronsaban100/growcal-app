import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Header } from "../components/Header";
import { Plant } from "../types";
import { colors, spacing } from "../theme";

type Props = {
  plants: Plant[];
};

export function ProfileScreen({ plants }: Props) {
  const collectionCount = plants.filter((plant) => plant.status === "personal" || plant.status === "collection").length;
  const sellingCount = plants.filter((plant) => plant.status === "for-sale" || plant.status === "selling").length;
  const auctionCount = plants.filter((plant) => plant.status === "auction").length;

  return (
    <View style={styles.screen}>
      <Header title="פרופיל" subtitle="אזור משתמש ראשוני לפני חיבור Clerk" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>ד</Text>
          </View>
          <Text style={styles.name}>דורון</Text>
          <Text style={styles.caption}>אספן ומוכר צמחים · מצב דמו</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="באוסף" value={collectionCount} />
          <Stat label="למכירה" value={sellingCount} />
          <Stat label="מכרזים" value={auctionCount} />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>חיבור לאפליקציה אמיתית</Text>
          <Text style={styles.noteText}>
            השלב הבא הוא לחבר Clerk Mobile Auth ואת Convex React Native client, ואז להחליף את נתוני הדמו בקריאות הקיימות של הפרויקט.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.stone200,
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.emerald100,
    borderRadius: 999,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  avatarText: {
    color: colors.emerald800,
    fontSize: 30,
    fontWeight: "900",
  },
  name: {
    color: colors.stone800,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 12,
  },
  caption: {
    color: colors.stone500,
    marginTop: 4,
    writingDirection: "rtl",
  },
  statsRow: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 14,
  },
  stat: {
    backgroundColor: colors.stone50,
    borderColor: colors.stone200,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  statValue: {
    color: colors.emerald800,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  statLabel: {
    color: colors.stone500,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  note: {
    backgroundColor: colors.emerald50,
    borderColor: colors.emerald100,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
    padding: 18,
  },
  noteTitle: {
    color: colors.emerald800,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
    writingDirection: "rtl",
  },
  noteText: {
    color: colors.stone600,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
