export const theme = {
  colors: {
    bg: "#0B1220",          // fundo principal (quase preto)
    card: "#111827",        // cartões
    surface: "#0F172A",     // superfícies
    border: "#1F2937",      // bordas
    text: "#E5E7EB",        // texto padrão
    textMuted: "#9CA3AF",   // texto secundário
    primary: "#2A87FF",     // azul neon
    primaryDark: "#1E5FD4",
    chip: "#0F1B33",
    danger: "#EF4444",
  },
  radius: 12,
  spacing: (n = 1) => 8 * n,
};
export type AppTheme = typeof theme;
