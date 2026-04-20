import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import { Problem } from "../../domain/problem";
import { theme } from "../../theme/theme";

type Props = {
  problem: Problem;
  address: string;
  aspectRatio?: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onVote: () => void;
  onOpenMap: () => void;
};

function normalizeDescription(text: string | undefined | null) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");
}

function ProblemCard({
  problem,
  address,
  aspectRatio,
  isExpanded,
  onToggleExpand,
  onVote,
  onOpenMap,
}: Props) {
  const normalizedDesc = normalizeDescription(problem.description);
  const showMoreButton = normalizedDesc.length > 80;
  const isOpen = String(problem.status).toLowerCase() === "aberto";

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{problem.title}</Text>

      {isOpen && (
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>Aberto</Text>
        </View>
      )}

      <Text style={styles.meta}>
        <Text style={{ fontWeight: "700" }}>Categoria: </Text>
        {problem.category}
      </Text>

      <Text style={styles.meta}>
        {address} • {new Date(problem.createdAt).toLocaleString()}
      </Text>

      {problem.image && (
        <View style={styles.imageWrapper}>
          {(() => {
            const aspect = aspectRatio;
            const isVertical = typeof aspect === "number" && aspect < 1;

            if (isVertical) {
              return (
                <Image
                  source={{ uri: problem.image }}
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
                  source={{ uri: problem.image }}
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
                source={{ uri: problem.image }}
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
            <Pressable style={styles.moreBtn} onPress={onToggleExpand}>
              <Text style={styles.moreText}>
                {isExpanded ? "Ver menos" : "Ver detalhes do registro"}
              </Text>
            </Pressable>
          )}
        </>
      ) : null}

      <View style={styles.rowBetween}>
        <Text style={styles.coords}>
          {problem.latitude.toFixed(4)}, {problem.longitude.toFixed(4)}
        </Text>

        <View style={styles.actionsRow}>
          <Pressable style={styles.voteBtn} onPress={onOpenMap}>
            <Text style={styles.voteText}>Mapa</Text>
          </Pressable>

          <Pressable style={styles.voteBtn} onPress={onVote}>
            <Text style={styles.voteText}>Votar {problem.votes}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default React.memo(ProblemCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  title: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },

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

  meta: {
    color: theme.colors.textMuted,
    marginTop: 2,
  },

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

  coords: {
    color: theme.colors.textMuted,
    fontWeight: "700",
  },

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

  voteText: {
    color: theme.colors.text,
    fontWeight: "900",
  },
});