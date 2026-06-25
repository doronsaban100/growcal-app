import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type Props = {
  icon: string;
  title: string;
  description: string;
};

export function EmptyState({ icon, title, description }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 260,
    padding: 28,
  },
  icon: {
    fontSize: 38,
    marginBottom: 16,
  },
  title: {
    color: colors.stone800,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    writingDirection: "rtl",
  },
  description: {
    color: colors.stone500,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 280,
    textAlign: "center",
    writingDirection: "rtl",
  },
});
