// domain/problemSchema.ts
import { z } from "zod";

// evita caracteres muito bizarros (emojis aleatórios, símbolos estranhos, etc.)
const weirdCharsRegex = /[^\wÀ-ÖØ-öø-ÿ0-9\s.,\-!?]/;

export const problemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Informe um título com pelo menos 5 caracteres.")
    .max(50, "O título pode ter no máximo 50 caracteres.")
    .refine((v) => !weirdCharsRegex.test(v), {
      message: "Evite caracteres especiais estranhos no título.",
    }),

  category: z
    .string()
    .trim()
    .min(1, "Selecione uma categoria."),

  city: z
    .string()
    .trim()
    .min(5, "Informe a cidade (mínimo 5 caracteres).")
    .max(50, "A cidade pode ter no máximo 50 caracteres.")
    .refine((v) => !weirdCharsRegex.test(v), {
      message: "Evite caracteres especiais estranhos na cidade.",
    }),

  // bairro agora é obrigatório
  neighborhood: z
    .string()
    .trim()
    .min(5, "Informe o bairro (mínimo 5 caracteres).")
    .max(50, "O bairro pode ter no máximo 50 caracteres.")
    .refine((v) => !weirdCharsRegex.test(v), {
      message: "Evite caracteres especiais estranhos no bairro.",
    }),

  description: z
    .string()
    .trim()
    .min(10, "Descreva melhor o problema (mínimo 10 caracteres).")
    .max(100, "A descrição pode ter no máximo 100 caracteres.")
    .refine((v) => !weirdCharsRegex.test(v), {
      message: "Evite caracteres especiais estranhos na descrição.",
    }),

  latitude: z.number({
    required_error:
      "Selecione um ponto no mapa ou use o botão 'Usar minha localização'.",
  }),

  longitude: z.number({
    required_error:
      "Selecione um ponto no mapa ou use o botão 'Usar minha localização'.",
  }),

  image: z.string().optional(),
});

export type ProblemInput = z.infer<typeof problemSchema>;
