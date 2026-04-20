import { create } from 'zustand';
import { Problem } from '../domain/problem';
import { ProblemInput } from '../domain/problemSchema';
import {
  clearStoredProblems,
  loadStoredProblems,
  saveStoredProblems,
} from '../services/problemsStorage';
import { createProblem } from '../utils/problem';

type VoteResult =
  | { ok: true }
  | { ok: false; reason: 'missing-user' | 'already-voted' | 'not-found' };

type Store = {
  problems: Problem[];
  loaded: boolean;
  load: () => Promise<void>;
  persist: () => Promise<void>;
  addProblem: (input: ProblemInput) => Promise<Problem | null>;
  vote: (id: string, userId?: string | null) => Promise<VoteResult>;
  setStatus: (id: string, status: Problem['status']) => Promise<boolean>;
  clearAll: () => Promise<void>;
};

export const useProblems = create<Store>((set, get) => ({
  problems: [],
  loaded: false,

  async load() {
    const problems = await loadStoredProblems();
    set({ problems, loaded: true });
  },

  async persist() {
    await saveStoredProblems(get().problems);
  },

  async addProblem(input) {
    try {
      const newItem = await createProblem(input);
      const updated = [newItem, ...get().problems];
      set({ problems: updated });
      await saveStoredProblems(updated);
      return newItem;
    } catch (error) {
      console.error('Erro ao adicionar problema:', error);
      return null;
    }
  },

  async vote(id, userId) {
    if (!userId) {
      return { ok: false, reason: 'missing-user' };
    }

    const current = get().problems;
    const target = current.find((item) => item.id === id);

    if (!target) {
      return { ok: false, reason: 'not-found' };
    }

    if (target.votedBy.includes(userId)) {
      return { ok: false, reason: 'already-voted' };
    }

    const updated = current.map((item) =>
      item.id === id
        ? {
            ...item,
            votes: item.votes + 1,
            votedBy: [...item.votedBy, userId],
          }
        : item
    );

    set({ problems: updated });
    await saveStoredProblems(updated);

    return { ok: true };
  },

  async setStatus(id, status) {
    const current = get().problems;
    const exists = current.some((item) => item.id === id);

    if (!exists) return false;

    const updated = current.map((item) =>
      item.id === id ? { ...item, status } : item
    );

    set({ problems: updated });
    await saveStoredProblems(updated);

    return true;
  },

  async clearAll() {
    set({ problems: [] });
    await clearStoredProblems();
  },
}));