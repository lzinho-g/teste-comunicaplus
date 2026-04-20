import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, AppState, AppStateStatus } from "react-native";
import * as Location from "expo-location";
import { useIsFocused } from "@react-navigation/native";
import { theme } from "../theme/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppHeader() {
  const [permStatus, setPermStatus] = useState<
    "granted" | "denied" | "undetermined"
  >("undetermined");
  const [servicesOn, setServicesOn] = useState<boolean>(false);
  const isFocused = useIsFocused();

  async function checkGps() {
    try {
      // 1) ver permissão atual
      let perm = await Location.getForegroundPermissionsAsync();

      // 2) se ainda não foi perguntado, pedir agora
      if (perm.status === "undetermined") {
        perm = await Location.requestForegroundPermissionsAsync();
      }

      // 3) checar se o serviço de localização do aparelho está ligado
      const on = await Location.hasServicesEnabledAsync();

      setPermStatus(perm.status);
      setServicesOn(on);
    } catch {
      setPermStatus("undetermined");
      setServicesOn(false);
    }
  }

  // quando a aba ganha foco
  useEffect(() => {
    if (isFocused) checkGps();
  }, [isFocused]);

  // quando o app volta pro foreground
  useEffect(() => {
    const sub = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") checkGps();
      }
    );
    return () => sub.remove();
  }, []);

  // poll leve
  useEffect(() => {
    const id = setInterval(checkGps, 4000);
    return () => clearInterval(id);
  }, []);

  // --- LÓGICA DOS 3 ESTADOS ---
  let label = "";
  let pillStyle = {};
  let textColor = "#fff";

  if (permStatus === "granted" && servicesOn) {
    // GPS ATIVO
    label = "GPS ativo";
    pillStyle = styles.gpsPillOn;
    textColor = "#22c55e";
  } else if (permStatus === "granted" && !servicesOn) {
    // PERMISSÃO OK, MAS SERVIÇO DESLIGADO
    label = "GPS desligado";
    pillStyle = styles.gpsPillOff;
    textColor = "#ef4444";
  } else {
    // PERMISSÃO NEGADA (ou nunca concedida)
    label = "GPS sem permissão";
    pillStyle = styles.gpsPillWarning;
    textColor = "#facc15";
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.left}>
          <View style={[styles.dot, { backgroundColor: "#34D399" }]} />
          <Text style={styles.brand}>Comunica+</Text>
        </View>

        <View style={[styles.gpsPillBase, pillStyle]}>
          <Text style={[styles.gpsText, { color: textColor }]}>{label}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: theme.colors.surface },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  brand: { color: theme.colors.text, fontSize: 18, fontWeight: "800" },

  // base do “pill”
  gpsPillBase: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  // estilos de cada estado
  gpsPillOn: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderColor: "#22c55e",
  },
  gpsPillOff: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "#ef4444",
  },
  gpsPillWarning: {
    backgroundColor: "rgba(250,204,21,0.08)",
    borderColor: "#facc15",
  },
  gpsText: { fontWeight: "700", fontSize: 12 },
});
