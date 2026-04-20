import { create } from 'zustand';
import { Problem, ProblemStatus } from '../domain/problem';
import { ProblemInput } from '../domain/problemSchema';
import {
  clearStoredProblems,
  loadStoredProblems,
  saveStoredProblems,
} from '../services/problemsStorage';
import { createProblem } from '../utils/problem';

type AddProblemResult =
  | { ok: true; problem: Problem }
  | { ok: false; message: string };

type VoteResult =
  | { ok: true }
  | { ok: false; reason: 'missing-user' | 'already-voted' | 'not-found' };

type SetStatusResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' };

type Store = {
  problems: Problem[];
  loaded: boolean;
  load: () => Promise<void>;
  persist: () => Promise<{ ok: true } | { ok: false; message: string }>;
  updateProblem: (id: string, data: Partial<Problem>) => Promise<void>;
  addProblem: (input: ProblemInput) => Promise<AddProblemResult>;
  vote: (id: string, userId?: string | null) => Promise<VoteResult>;
  setStatus: (id: string, status: ProblemStatus) => Promise<SetStatusResult>;
  clearAll: () => Promise<{ ok: true } | { ok: false; message: string }>;
};

export const useProblems = create<Store>((set, get) => {
  async function updateProblems(updated: Problem[]) {
    await saveStoredProblems(updated);
    set({ problems: updated });
  }

  return {
    problems: [],
    loaded: false,

    async load() {
      const problems = await loadStoredProblems();
      set({ problems, loaded: true });
    },

    async persist() {
      try {
        await saveStoredProblems(get().problems);
        return { ok: true };
      } catch (error) {
        console.error('Erro ao persistir problemas:', error);
        return { ok: false, message: 'Não foi possível salvar os problemas.' };
      }
    },

    async updateProblem(id, data) {
      const current = get().problems;

      const updated = current.map((p) =>
        p.id === id ? { ...p, ...data } : p
      );

      await saveStoredProblems(updated);
      set({ problems: updated });
    },

    async addProblem(input) {
      try {
        const newProblem = await createProblem(input);
        const updated = [newProblem, ...get().problems];

        await updateProblems(updated);

        return { ok: true, problem: newProblem };
      } catch (error) {
        console.error('Erro ao adicionar problema:', error);
        return { ok: false, message: 'Não foi possível adicionar o problema.' };
      }
    },

    async vote(id, userId) {
      try {
        if (!userId) {
          return { ok: false, reason: 'missing-user' };
        }

        const currentProblems = get().problems;
        const target = currentProblems.find((item) => item.id === id);

        if (!target) {
          return { ok: false, reason: 'not-found' };
        }

        if (target.votedBy.includes(userId)) {
          return { ok: false, reason: 'already-voted' };
        }

        const updated = currentProblems.map((item) =>
          item.id === id
            ? {
                ...item,
                votes: item.votes + 1,
                votedBy: [...item.votedBy, userId],
              }
            : item
        );

        await updateProblems(updated);

        return { ok: true };
      } catch (error) {
        console.error('Erro ao votar no problema:', error);
        return { ok: false, reason: 'not-found' };
      }
    },

    async setStatus(id, status) {
      try {
        const currentProblems = get().problems;
        const exists = currentProblems.some((item) => item.id === id);

        if (!exists) {
          return { ok: false, reason: 'not-found' };
        }

        const updated = currentProblems.map((item) =>
          item.id === id ? { ...item, status } : item
        );

        await updateProblems(updated);

        return { ok: true };
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        return { ok: false, reason: 'not-found' };
      }
    },

    async clearAll() {
      try {
        await clearStoredProblems();
        set({ problems: [] });
        return { ok: true };
      } catch (error) {
        console.error('Erro ao limpar problemas:', error);
        return { ok: false, message: 'Não foi possível limpar os problemas.' };
      }
    },
  };
});