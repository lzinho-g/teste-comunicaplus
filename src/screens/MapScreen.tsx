import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useFeedAddresses } from "../hooks/useFeedAddresses";
import {
  View,
  StyleSheet,
  Animated,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import MapProblemCard from "../components/map/MapProblemCard";
import * as Location from "expo-location";
import { useProblems } from "../state/useProblems";
import { useAuth } from "../state/useAuth";
import type { Problem } from "../domain/problem";
import { theme } from "../theme/theme";
import { RootTabParamList } from "../navigation/types";


import pinBlue from "../../assets/pins/pin-blue.png";
import pinRed from "../../assets/pins/pin-red.png";

const FOCUS_LAT_DELTA = 0.003;
const FOCUS_LNG_DELTA = 0.003;
const PIN_OFFSET_FACTOR = 0.25;

export default function MapScreen() {
  const { problems, vote } = useProblems();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const route = useRoute<RouteProp<RootTabParamList, "Mapa">>();
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
  const addresses = useFeedAddresses(validProblems);

  const [selected, setSelected] = useState<Problem | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

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

  function getPrettyAddress(p: Problem): string {
  const addrFromMap = addresses[p.id];

  if (addrFromMap && addrFromMap.trim().length > 0) {
    return addrFromMap;
  }

  if (p.neighborhood && p.neighborhood.trim().length > 0) {
    return `${p.neighborhood}, ${p.city}`;
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
          <MapProblemCard
            problem={selected}
            address={getPrettyAddress(selected)}
            isExpanded={expanded}
            onToggleExpand={() => setExpanded((prev) => !prev)}
            onOpenFeed={() =>
              navigation.navigate("Feed", { focusId: selected.id })
            }
            onVote={async () => {
              const userId = user?.email ?? null;

              if (!userId) return;

              await vote(selected.id, userId);
            }}
          />
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
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
