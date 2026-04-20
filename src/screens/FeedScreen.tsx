import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useProblems } from "../state/useProblems";
import { useAuth } from "../state/useAuth";
import { theme } from "../theme/theme";
import { Problem } from "../domain/problem";
import { useFeedAddresses } from "../hooks/useFeedAddresses";
import { useImageAspectRatios } from "../hooks/useImageAspectRatios";
import { useDebounce } from "../hooks/useDebounce";
import ProblemCard from "../components/problem/ProblemCard";
import { RootTabParamList } from "../navigation/types";

function normalize(str: string | undefined | null) {
  return (str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

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

  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const route = useRoute<RouteProp<RootTabParamList, "Feed">>();

  const listRef = useRef<FlatList<Problem>>(null);

  const [orderBy, setOrderBy] = useState<"recent" | "votes">("recent");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const aspectRatios = useImageAspectRatios(problems);
  const addresses = useFeedAddresses(problems);

  const focusId: string | undefined = route.params?.focusId;

  const getPrettyAddress = useCallback(
    (problem: Problem): string => {
      const addrFromMap = addresses[problem.id];
      if (addrFromMap && addrFromMap.trim().length > 0) {
        return addrFromMap;
      }
      if (problem.neighborhood && problem.neighborhood.trim().length > 0) {
        return `${problem.neighborhood}, ${problem.city}`;
      }
      return problem.city;
    },
    [addresses]
  );

  const items = useMemo(() => {
    let arr = [...problems];

    const qNorm = normalize(debouncedSearch.trim());
    if (qNorm.length > 0) {
      arr = arr.filter((problem) => {
        const addrNorm = normalize(getPrettyAddress(problem));
        const descNorm = normalize(
          normalizeDescription(problem.description)
        );

        return (
          normalize(problem.title).includes(qNorm) ||
          normalize(problem.city).includes(qNorm) ||
          normalize(problem.neighborhood).includes(qNorm) ||
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
  }, [problems, orderBy, debouncedSearch, getPrettyAddress]);

  useEffect(() => {
    if (!focusId || !items.length) return;

    setSearch("");
    setSearchOpen(false);
    setOrderBy("recent");
    setExpandedId(focusId);

    const index = items.findIndex((problem) => problem.id === focusId);
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

  const handleGoToMap = useCallback(
    (id: string) => {
      navigation.navigate("Mapa", { focusId: id });
    },
    [navigation]
  );

  const handleToggleSearch = useCallback(() => {
    setSearchOpen((prev) => {
      if (prev) {
        setSearch("");
        return false;
      }
      return true;
    });
  }, []);

  const handleVote = useCallback(
    async (problemId: string) => {
      const userId = user?.email ?? null;

      if (!userId) {
        Alert.alert(
          "Atenção",
          "Você precisa estar logado para votar."
        );
        return;
      }

      const result = await vote(problemId, userId);

      if (!result.ok) {
        if (result.reason === "already-voted") {
          Alert.alert(
            "Voto não permitido",
            "Você já votou neste problema."
          );
        } else if (result.reason === "missing-user") {
          Alert.alert(
            "Atenção",
            "Usuário não identificado para votar."
          );
        } else {
          Alert.alert(
            "Erro",
            "Problema não encontrado para receber voto."
          );
        }
      }
    },
    [user?.email, vote]
  );

  const keyExtractor = useCallback((item: Problem) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Problem }) => (
      <ProblemCard
        problem={item}
        address={getPrettyAddress(item)}
        aspectRatio={aspectRatios[item.id]}
        isExpanded={expandedId === item.id}
        onToggleExpand={() =>
          setExpandedId((prev) => (prev === item.id ? null : item.id))
        }
        onOpenMap={() => handleGoToMap(item.id)}
        onVote={() => handleVote(item.id)}
      />
    ),
    [aspectRatios, expandedId, getPrettyAddress, handleGoToMap, handleVote]
  );

  if (!problems.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Nenhum problema ainda. Envie na aba “Novo”.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: theme.colors.bg }}>
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
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
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

  emptyText: {
    color: "#666",
  },

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

  chipText: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 13,
  },

  chipTextActive: {
    color: "#fff",
  },

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

  emptySearch: {
    paddingTop: 32,
    alignItems: "center",
  },

  emptySearchText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
});