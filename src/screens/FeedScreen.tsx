import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { useProblems } from "../state/useProblems";
import { useAuth } from "../state/useAuth";
import { theme } from "../theme/theme";

// helper para busca sem acento / case-insensitive
function normalize(str: string | undefined | null) {
  return (str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// normaliza descrição: remove linhas em branco e espaços exagerados
function normalizeDescription(text: string | undefined | null) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");
}

export default function FeedScreen() {
  const { problems, vote } = useProblems();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const listRef = useRef<FlatList<any>>(null);

  const [orderBy, setOrderBy] = useState<"recent" | "votes">("recent");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addresses, setAddresses] = useState<Record<string, string>>({});

  // id enviado pelo mapa
  const focusId: string | undefined = route.params?.focusId;

  // carregar aspectRatio das imagens
  useEffect(() => {
    problems.forEach((p) => {
      if (p.image && !aspectRatios[p.id]) {
        Image.getSize(
          p.image,
          (w, h) => {
            if (w && h) {
              setAspectRatios((prev) => ({
                ...prev,
                [p.id]: w / h,
              }));
            }
          },
          () => {}
        );
      }
    });
  }, [problems, aspectRatios]);

  // reverse geocode para endereço
  useEffect(() => {
    (async () => {
      for (const p of problems) {
        if (addresses[p.id]) continue;
        if (
          typeof p.latitude !== "number" ||
          Number.isNaN(p.latitude) ||
          typeof p.longitude !== "number" ||
          Number.isNaN(p.longitude)
        ) {
          continue;
        }

        try {
          const res = await Location.reverseGeocodeAsync({
            latitude: p.latitude,
            longitude: p.longitude,
          });

          if (res && res.length > 0) {
            const r = res[0];

            const streetPart =
              r.street && r.name
                ? `${r.street}, ${r.name}`
                : r.street || r.name || "";
            const districtPart = r.district || "";
            const cityPart = r.city || r.subregion || "";

            const parts = [streetPart, districtPart, cityPart].filter(
              (t) => t && t.trim().length > 0
            );
            const formatted = parts.join(" - ");

            if (formatted) {
              setAddresses((prev) => ({ ...prev, [p.id]: formatted }));
            }
          }
        } catch {
          // ignora erro, usa fallback
        }
      }
    })();
  }, [problems, addresses]);

  function getPrettyAddress(p: any): string {
    const addrFromMap = addresses[p.id];
    if (addrFromMap && addrFromMap.trim().length > 0) {
      return addrFromMap;
    }
    if (p.neighborhood && p.neighborhood.trim().length > 0) {
      return `${p.neighborhood}, ${p.city}`;
    }
    return p.city;
  }

  const items = useMemo(() => {
    let arr = [...problems];

    const qNorm = normalize(search.trim());
    if (qNorm.length > 0) {
      arr = arr.filter((p) => {
        const addrNorm = normalize(getPrettyAddress(p));
        const descNorm = normalize(normalizeDescription(p.description));
        return (
          normalize(p.title).includes(qNorm) ||
          normalize(p.city).includes(qNorm) ||
          normalize(p.neighborhood).includes(qNorm) ||
          descNorm.includes(qNorm) ||
          addrNorm.includes(qNorm)
        );
      });
    }

    if (orderBy === "recent") {
      arr.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      arr.sort((a, b) => b.votes - a.votes);
    }
    return arr;
  }, [problems, orderBy, search, addresses]);

  // 🔍 quando vier do mapa com focusId, rola até o card e (opcional) expande
  useEffect(() => {
    if (!focusId || !items.length) return;

    setSearch("");
    setSearchOpen(false);
    setOrderBy("recent");
    setExpandedId(focusId);

    const index = items.findIndex((p) => p.id === focusId);
    if (index === -1) return;

    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.1,
      });

      navigation.setParams({ focusId: undefined });
    }, 100);
  }, [focusId, items, navigation]);

  // ⚠️ IMPORTANTE: o return condicional vem DEPOIS de todos os hooks
  if (!problems.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Nenhum problema ainda. Envie na aba “Novo”.
        </Text>
      </View>
    );
  }

  function handleGoToMap(id: string) {
    navigation.navigate("Mapa", { focusId: id });
  }

  function handleToggleSearch() {
    if (searchOpen) {
      setSearch("");
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
    }
  }

  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: theme.colors.bg }}>
      {/* Chips de ordenação + buscar */}
      <View style={styles.row}>
        <Pressable
          onPress={() => setOrderBy("recent")}
          style={[styles.chip, orderBy === "recent" && styles.chipActive]}
        >
          <Text
            style={[
              styles.chipText,
              orderBy === "recent" && styles.chipTextActive,
            ]}
          >
            Mais recentes
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setOrderBy("votes")}
          style={[styles.chip, orderBy === "votes" && styles.chipActive]}
        >
          <Text
            style={[
              styles.chipText,
              orderBy === "votes" && styles.chipTextActive,
            ]}
          >
            Mais votados
          </Text>
        </Pressable>

        <Pressable
          onPress={handleToggleSearch}
          style={[styles.chip, searchOpen && styles.chipActive]}
        >
          <Text
            style={[
              styles.chipText,
              searchOpen && styles.chipTextActive,
            ]}
          >
            Buscar
          </Text>
        </Pressable>
      </View>

      {searchOpen && (
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por rua, bairro, cidade..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      )}

      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const ratio = aspectRatios[item.id];
          const address = getPrettyAddress(item);

          const normalizedDesc = normalizeDescription(item.description);
          const isExpanded = expandedId === item.id;
          const showMoreButton = normalizedDesc.length > 80;
          const isOpen = String(item.status).toLowerCase() === "aberto";

          return (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>

              {isOpen && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>Aberto</Text>
                </View>
              )}

              {/* Categoria */}
              <Text style={styles.meta}>
                <Text style={{ fontWeight: "700" }}>Categoria: </Text>
                {item.category}
              </Text>

              <Text style={styles.meta}>
                {address} • {new Date(item.createdAt).toLocaleString()}
              </Text>

              {item.image && (
                <View style={styles.imageWrapper}>
                  {(() => {
                    const aspect = ratio;
                    const isVertical =
                      typeof aspect === "number" && aspect < 1;

                    if (isVertical) {
                      return (
                        <Image
                          source={{ uri: item.image }}
                          style={{
                            width: "65%",
                            alignSelf: "center",
                            aspectRatio: aspect,
                            maxHeight: 260,
                            borderRadius: 8,
                          }}
                          resizeMode="cover"
                        />
                      );
                    }

                    if (typeof aspect === "number") {
                      return (
                        <Image
                          source={{ uri: item.image }}
                          style={{
                            width: "100%",
                            aspectRatio: aspect,
                            maxHeight: 260,
                            borderRadius: 8,
                          }}
                          resizeMode="cover"
                        />
                      );
                    }

                    return (
                      <Image
                        source={{ uri: item.image }}
                        style={{
                          width: "100%",
                          height: 180,
                          maxHeight: 260,
                          borderRadius: 8,
                        }}
                        resizeMode="cover"
                      />
                    );
                  })()}
                </View>
              )}

              {normalizedDesc ? (
                <>
                  <Text
                    style={styles.description}
                    numberOfLines={isExpanded ? 0 : 3}
                    ellipsizeMode="tail"
                  >
                    {normalizedDesc}
                  </Text>

                  {showMoreButton && (
                    <Pressable
                      style={styles.moreBtn}
                      onPress={() =>
                        setExpandedId((prev) =>
                          prev === item.id ? null : item.id
                        )
                      }
                    >
                      <Text style={styles.moreText}>
                        {isExpanded
                          ? "Ver menos"
                          : "Ver detalhes do registro"}
                      </Text>
                    </Pressable>
                  )}
                </>
              ) : null}

              <View style={styles.rowBetween}>
                <Text style={styles.coords}>
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.voteBtn}
                    onPress={() => handleGoToMap(item.id)}
                  >
                    <Text style={styles.voteText}>Mapa</Text>
                  </Pressable>

                  <Pressable
                    style={styles.voteBtn}
                    onPress={async () => {
                      const userId = user?.email ?? null;
                      if (!userId) {
                        Alert.alert(
                          "Atenção",
                          "Você precisa estar logado para votar."
                        );
                        return;
                      }

                      const ok = await vote(item.id, userId);
                      if (!ok) {
                        Alert.alert(
                          "Voto não permitido",
                          "Você já votou neste problema."
                        );
                      }
                    }}
                  >
                    <Text style={styles.voteText}>Votar {item.votes}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          search.trim().length > 0 ? (
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>
                Nenhum problema encontrado para "{search.trim()}".
              </Text>
            </View>
          ) : null
        }
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }, 100);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: theme.colors.bg,
  },
  emptyText: { color: "#666" },

  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },

  chip: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: { color: theme.colors.text, fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#fff" },

  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 13,
  },

  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  title: { fontSize: 16, fontWeight: "800", color: theme.colors.text },

  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  statusBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  meta: { color: theme.colors.textMuted, marginTop: 2 },

  imageWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 6,
  },

  description: {
    marginTop: 2,
    fontSize: 13,
    color: theme.colors.text,
  },

  moreBtn: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  moreText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primary,
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  coords: { color: theme.colors.textMuted, fontWeight: "700" },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  voteBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  voteText: { color: theme.colors.text, fontWeight: "900" },

  emptySearch: {
    paddingTop: 32,
    alignItems: "center",
  },
  emptySearchText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
});
