import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { Problem } from "../../domain/problem";
import { theme } from "../../theme/theme";

type Props = {
  problem: Problem;
  address: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onVote: () => void;
  onOpenFeed: () => void;
};

function normalizeDescription(text: string | undefined | null) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");
}

function shortDescription(text: string, expanded: boolean) {
  const MAX = 80;

  if (expanded || text.length <= MAX) return text;

  return text.slice(0, MAX).trimEnd() + "…";
}

function MapProblemCard({
  problem,
  address,
  isExpanded,
  onToggleExpand,
  onVote,
  onOpenFeed,
}: Props) {
  const desc = normalizeDescription(problem.description);

  const isOpen = String(problem.status).toLowerCase() === "aberto";
  const showMore = desc.length > 80;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{problem.title}</Text>

      {isOpen && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Aberto</Text>
        </View>
      )}

      <Text style={styles.meta}>
        <Text style={{ fontWeight: "700" }}>Categoria: </Text>
        {problem.category}
      </Text>

      <Text style={styles.meta}>
        {address} • {new Date(problem.createdAt).toLocaleString()}
      </Text>

      {desc ? (
        <>
          <Text style={styles.description}>
            {shortDescription(desc, isExpanded)}
          </Text>

          {showMore && (
            <Pressable onPress={onToggleExpand}>
              <Text style={styles.moreText}>
                {isExpanded ? "Ver menos" : "Ver mais"}
              </Text>
            </Pressable>
          )}
        </>
      ) : null}

      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={onOpenFeed}>
          <Text style={styles.btnText}>Feed</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={onVote}>
          <Text style={styles.btnText}>Votar {problem.votes}</Text>
        </Pressable>
      </View>

      <Text style={styles.coords}>
        {problem.latitude.toFixed(4)}, {problem.longitude.toFixed(4)}
      </Text>
    </View>
  );
}

export default React.memo(MapProblemCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  title: {
    fontWeight: "800",
    fontSize: 16,
    color: theme.colors.text,
  },

  badge: {
    backgroundColor: theme.colors.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 4,
  },

  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  meta: {
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  description: {
    marginTop: 6,
    color: theme.colors.text,
  },

  moreText: {
    marginTop: 4,
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  btn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  btnText: {
    fontWeight: "800",
    color: theme.colors.text,
  },

  coords: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});