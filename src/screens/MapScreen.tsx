import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Animated,
  LayoutAnimation,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { useProblems } from "../state/useProblems";
import type { Problem } from "../state/useProblems";
import { theme } from "../theme/theme";

import pinBlue from "../../assets/pins/pin-blue.png";
import pinRed from "../../assets/pins/pin-red.png";

const FOCUS_LAT_DELTA = 0.003;
const FOCUS_LNG_DELTA = 0.003;
const PIN_OFFSET_FACTOR = 0.25;

export default function MapScreen() {
  const { problems } = useProblems();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mapRef = useRef<MapView>(null);

  const validProblems = useMemo(
    () =>
      problems.filter(
        (p) =>
          typeof p.latitude === "number" &&
          !Number.isNaN(p.latitude) &&
          typeof p.longitude === "number" &&
          !Number.isNaN(p.longitude)
      ),
    [problems]
  );

  const focusId: string | undefined = route.params?.focusId;

  const [selected, setSelected] = useState<Problem | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);

  // 👉 controle de tamanho da descrição
  const MAX_DESCRIPTION_LENGTH = 160; // ajuste esse valor se quiser mais/menos texto

  // Descrição original (do problema selecionado)
  const rawDescription = selected?.description ?? "";

  // Normaliza para remover linhas em branco e espaços exagerados
  const description = rawDescription
    .split("\n") // separa por linhas
    .map((line) => line.trim()) // remove espaços no começo/fim de cada linha
    .filter((line) => line.length > 0) // remove linhas vazias
    .join(" "); // junta tudo em uma única frase

  const isLongDescription = description.length > MAX_DESCRIPTION_LENGTH;
  const shortDescription = isLongDescription
    ? description.slice(0, MAX_DESCRIPTION_LENGTH) + "..."
    : description;

  // sempre que trocar o problema selecionado, começa recolhido
  useEffect(() => {
    setExpanded(false);
  }, [selected?.id]);

  // Tornar handlers estáveis
  const openCard = useCallback(
    (problem: Problem) => {
      setSelected(problem);
      setExpanded(false);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
    [slideAnim]
  );

  const closeCard = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelected(null);
      setExpanded(false);
    });
  }, [slideAnim]);

  function handleGoToFeed() {
    if (!selected) return;
    navigation.navigate("Feed", { focusId: selected.id });
  }

  const initialRegion = useMemo(() => {
    if (validProblems.length > 0) {
      const p = validProblems[0];
      return {
        latitude: p.latitude,
        longitude: p.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    return {
      latitude: -27.5969,
      longitude: -48.5495,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }, [validProblems]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const loc = await Location.getCurrentPositionAsync({});
        const region: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        };

        mapRef.current?.animateToRegion(region, 700);
      } catch (e) {
        console.log("Erro ao obter localização inicial", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!mapRef.current || validProblems.length === 0) return;

    const coords = validProblems.map((p: Problem) => ({
      latitude: p.latitude,
      longitude: p.longitude,
    }));

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 60, right: 60, bottom: 140, left: 60 },
      animated: true,
    });
  }, [validProblems]);

  function focusOnProblem(p: Problem, duration = 300) {
    const offset = FOCUS_LAT_DELTA * PIN_OFFSET_FACTOR;
    const centerLat = p.latitude - offset;

    mapRef.current?.animateToRegion(
      {
        latitude: centerLat,
        longitude: p.longitude,
        latitudeDelta: FOCUS_LAT_DELTA,
        longitudeDelta: FOCUS_LNG_DELTA,
      },
      duration
    );
  }

  useEffect(() => {
    if (!focusId || validProblems.length === 0) return;

    const p = validProblems.find((pr) => pr.id === focusId);
    if (!p) return;

    openCard(p);
    focusOnProblem(p, 300);
  }, [focusId, validProblems, openCard]);

  useEffect(() => {
    (async () => {
      for (const p of validProblems) {
        if (addresses[p.id]) continue;

        try {
          const results = await Location.reverseGeocodeAsync({
            latitude: p.latitude,
            longitude: p.longitude,
          });

          if (results && results.length > 0) {
            const r = results[0];

            const streetPart =
              r.street && r.name
                ? `${r.street}, ${r.name}`
                : r.street || r.name || "";
            const districtPart = r.district || "";
            const cityPart = r.city || r.subregion || "";

            const pieces = [streetPart, districtPart, cityPart].filter(
              (t) => t && t.trim().length > 0
            );

            const formatted = pieces.join(" - ");

            if (formatted) {
              setAddresses((prev) => ({
                ...prev,
                [p.id]: formatted,
              }));
            }
          }
        } catch {
          // ignora e usa fallback
        }
      }
    })();
  }, [validProblems, addresses]);

  function getPrettyAddress(p: Problem): string {
    const addrFromMap = addresses[p.id];
    if (addrFromMap && addrFromMap.trim().length > 0) {
      return addrFromMap;
    }
    if ((p as any).neighborhood && (p as any).neighborhood.trim().length > 0) {
      return `${(p as any).neighborhood}, ${p.city}`;
    }
    return p.city;
  }

  const coordsMap = useMemo(() => {
    const m: Record<string, { latitude: number; longitude: number }> = {};
    validProblems.forEach((p) => {
      m[p.id] = { latitude: p.latitude, longitude: p.longitude };
    });
    return m;
  }, [validProblems]);

  const handleMarkerPress = useCallback(
    (p: Problem) => {
      openCard(p);
      focusOnProblem(p, 250);
    },
    [openCard]
  );

  const MarkerItem = useCallback(
    React.memo(
      ({
        id,
        coordinate,
        isSelected,
      }: {
        id: string;
        coordinate: { latitude: number; longitude: number };
        isSelected: boolean;
      }) => {
        return (
          <Marker
            key={id}
            coordinate={coordinate}
            onPress={() => {
              const p = validProblems.find((x) => x.id === id);
              if (p) handleMarkerPress(p);
            }}
            image={isSelected ? pinRed : pinBlue}
            tracksViewChanges={false}
            zIndex={isSelected ? 999 : 1}
            identifier={id}
          />
        );
      },
      (prev, next) => {
        return (
          prev.id === next.id &&
          prev.isSelected === next.isSelected &&
          prev.coordinate.latitude === next.coordinate.latitude &&
          prev.coordinate.longitude === next.coordinate.longitude
        );
      }
    ),
    [validProblems, handleMarkerPress]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
      >
        {validProblems.map((p) => {
          const coord = coordsMap[p.id];
          const isSelected = selected?.id === p.id;

          return (
            <MarkerItem
              key={p.id}
              id={p.id}
              coordinate={coord}
              isSelected={isSelected}
            />
          );
        })}
      </MapView>

      {selected && (
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [250, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.cardTitle}>
            {selected.title} • {selected.votes} voto
            {selected.votes === 1 ? "" : "s"}
          </Text>

          {String(selected.status).toLowerCase() === "aberto" && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Aberto</Text>
            </View>
          )}

          <Text style={styles.cardInfo}>
            <Text style={{ fontWeight: "700" }}>Categoria: </Text>
            {selected.category}
          </Text>

          <Text style={styles.cardInfo}>
            <Text style={{ fontWeight: "700" }}>Endereço: </Text>
            {getPrettyAddress(selected)}
          </Text>

          {description ? (
            <>
              <Text style={styles.cardDesc}>
                {expanded || !isLongDescription ? description : shortDescription}
              </Text>

              {isLongDescription && (
                <Pressable
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut
                    );
                    setExpanded((s) => !s);
                  }}
                  style={{ marginTop: 6 }}
                >
                  <Text style={styles.moreText}>
                    {expanded ? "Ver menos" : "Ver mais"}
                  </Text>
                </Pressable>
              )}
            </>
          ) : null}

          <View style={styles.row}>
            <Pressable
              style={[styles.button, styles.voteBtn]}
              onPress={handleGoToFeed}
            >
              <Text style={styles.buttonText}>Ver no feed</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.closeBtn]}
              onPress={closeCard}
            >
              <Text style={styles.buttonText}>Fechar</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    bottom: 80,
    left: 10,
    right: 10,
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardInfo: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 6,
  },
  moreText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  statusBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  voteBtn: {
    backgroundColor: theme.colors.primary,
  },
  closeBtn: {
    backgroundColor: theme.colors.danger,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
