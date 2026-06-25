import React, { useMemo, useState } from "react";
import { I18nManager, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { initialPlants } from "./src/data/plants";
import { AuctionsScreen } from "./src/screens/AuctionsScreen";
import { InventoryScreen } from "./src/screens/InventoryScreen";
import { MarketScreen } from "./src/screens/MarketScreen";
import { NewPlantScreen } from "./src/screens/NewPlantScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { Plant, PlantStatus, TabKey } from "./src/types";
import { colors } from "./src/theme";

I18nManager.allowRTL(true);

const tabs: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "profile", label: "פרופיל", icon: "person-circle-outline" },
  { key: "shop", label: "חנות", icon: "storefront-outline" },
  { key: "collection", label: "אוסף", icon: "leaf-outline" },
  { key: "new", label: "", icon: "add" },
  { key: "auctions", label: "מכרזים", icon: "hammer-outline" },
  { key: "market", label: "שוק", icon: "basket-outline" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("market");
  const [plants, setPlants] = useState<Plant[]>(initialPlants);

  const collectionPlants = useMemo(
    () => plants.filter((plant) => plant.status === "personal" || plant.status === "collection"),
    [plants],
  );
  const shopPlants = useMemo(
    () => plants.filter((plant) => plant.status === "for-sale" || plant.status === "selling"),
    [plants],
  );

  const updateStatus = (id: string, status: PlantStatus) => {
    setPlants((current) =>
      current.map((plant) =>
        plant.id === id
          ? {
              ...plant,
              status,
              listingId: status === "personal" ? undefined : plant.listingId ?? `listing-${plant.id}`,
              auctionEndTime: status === "auction" ? plant.auctionEndTime ?? Date.now() + 3600000 * 6 : plant.auctionEndTime,
            }
          : plant,
      ),
    );
  };

  const updateWatering = (id: string) => {
    setPlants((current) => current.map((plant) => (plant.id === id ? { ...plant, wateringDate: Date.now() } : plant)));
  };

  const updatePrice = (id: string, price: number) => {
    setPlants((current) =>
      current.map((plant) => (plant.id === id ? { ...plant, currentPrice: price, estimatedValue: price } : plant)),
    );
  };

  const placeBid = (id: string) => {
    setPlants((current) =>
      current.map((plant) => (plant.id === id ? { ...plant, currentPrice: plant.currentPrice + 10 } : plant)),
    );
  };

  const renderScreen = () => {
    if (activeTab === "market") return <MarketScreen plants={plants} />;
    if (activeTab === "shop") {
      return (
        <InventoryScreen
          title="החנות שלי"
          subtitle="מודעות ופריטים שלך למכירה"
          emptyIcon="🛒"
          emptyTitle="אין כרגע פריטים למכירה"
          emptyDescription="צמחים שתעביר לסטטוס מכירה יופיעו כאן."
          plants={shopPlants}
          editable
          onWater={updateWatering}
          onStatusChange={updateStatus}
          onPriceChange={updatePrice}
        />
      );
    }
    if (activeTab === "collection") {
      return (
        <InventoryScreen
          title="האוסף שלי"
          subtitle="ניהול טיפול, מחיר וסטטוס"
          emptyIcon="🌿"
          emptyTitle="האוסף עדיין ריק"
          emptyDescription="הוסף צמח ראשון או העבר פריט מהחנות לאוסף."
          plants={collectionPlants}
          editable
          onWater={updateWatering}
          onStatusChange={updateStatus}
          onPriceChange={updatePrice}
        />
      );
    }
    if (activeTab === "auctions") return <AuctionsScreen plants={plants} onBid={placeBid} />;
    if (activeTab === "new") return <NewPlantScreen onCreate={(plant) => setPlants((current) => [plant, ...current])} onNavigate={setActiveTab} />;
    return <ProfileScreen plants={plants} />;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.app}>{renderScreen()}</View>
        <View style={styles.nav}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            const isAdd = tab.key === "new";
            return (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={styles.navItem}>
                <View style={[isAdd ? styles.addButton : styles.iconWrap, active && !isAdd && styles.iconWrapActive]}>
                  <Ionicons name={tab.icon} size={isAdd ? 28 : 23} color={isAdd ? "#fff" : active ? colors.emerald800 : colors.stone500} />
                </View>
                {tab.label ? <Text style={[styles.navText, active && styles.navTextActive]}>{tab.label}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  app: {
    flex: 1,
  },
  nav: {
    alignItems: "center",
    backgroundColor: "rgba(250,250,249,0.98)",
    borderTopColor: colors.stone200,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 2,
    height: 78,
    justifyContent: "space-around",
    left: 0,
    paddingHorizontal: 6,
    position: "absolute",
    right: 0,
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 42,
  },
  iconWrapActive: {
    backgroundColor: colors.emerald100,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.emerald700,
    borderColor: "#fff",
    borderRadius: 999,
    borderWidth: 4,
    height: 54,
    justifyContent: "center",
    marginTop: -24,
    width: 54,
  },
  navText: {
    color: colors.stone500,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  navTextActive: {
    color: colors.emerald800,
    fontWeight: "900",
  },
});
