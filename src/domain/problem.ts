import { ProblemInput } from './problemSchema';

export type ProblemStatus = 'Aberto' | 'Em andamento' | 'Resolvido';

export type Problem = ProblemInput & {
  id: string;
  address?: string;
  status: ProblemStatus;
  votes: number;
  votedBy: string[];
  createdAt: number;
};