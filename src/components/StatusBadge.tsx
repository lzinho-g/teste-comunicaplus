import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ProblemStatus } from "../domain/problem";

type Props = {
  status: ProblemStatus;
};

function getStatusColor(status: ProblemStatus): string {
  if (status === "Aberto") return "#3b82f6";
  if (status === "Em andamento") return "#F59E0B";
  return "#22c55e";
}

function getStatusTextColor(status: ProblemStatus): string {
  if (status === "Em andamento") return "#111827";
  return "#fff";
}

export function StatusBadge({ status }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={[styles.text, { color: getStatusTextColor(status) }]}>{status}</Text>
    </View>
  );
}

export default StatusBadge;

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  text: {
    fontWeight: "700",
    fontSize: 12,
  },
});
