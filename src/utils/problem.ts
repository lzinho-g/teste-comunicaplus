import * as Crypto from 'expo-crypto';
import { Problem } from '../domain/problem';
import { ProblemInput } from '../domain/problemSchema';

export function isValidProblem(raw: unknown): raw is Problem {
  if (!raw || typeof raw !== 'object') return false;

  const item = raw as Record<string, unknown>;

  const latOk =
    typeof item.latitude === 'number' && !Number.isNaN(item.latitude);
  const lngOk =
    typeof item.longitude === 'number' && !Number.isNaN(item.longitude);

  const idOk = typeof item.id === 'string' && item.id.length > 0;
  const votesOk = typeof item.votes === 'number';
  const votedByOk = Array.isArray(item.votedBy);
  const createdAtOk = typeof item.createdAt === 'number';
  const statusOk =
    item.status === 'Aberto' ||
    item.status === 'Em andamento' ||
    item.status === 'Resolvido';
  const addressOk =
    item.address === undefined || typeof item.address === 'string';

  return (
    latOk &&
    lngOk &&
    idOk &&
    votesOk &&
    votedByOk &&
    createdAtOk &&
    statusOk &&
    addressOk
  );
}

export function sanitizeLoadedProblems(raw: unknown): Problem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidProblem);
}

export async function createProblem(input: ProblemInput): Promise<Problem> {
  return {
    ...input,
    id: Crypto.randomUUID(),
    status: 'Aberto',
    votes: 0,
    votedBy: [],
    createdAt: Date.now(),
  };
}