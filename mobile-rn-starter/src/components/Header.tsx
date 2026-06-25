import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

type Props = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

export function Header({ title, subtitle, rightSlot }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightSlot}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.stone100,
    borderBottomWidth: 1,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screen,
    paddingBottom: 16,
    paddingTop: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: colors.stone800,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "right",
    writingDirection: "rtl",
  },
  subtitle: {
    color: colors.stone500,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
