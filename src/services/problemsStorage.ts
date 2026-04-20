import AsyncStorage from '@react-native-async-storage/async-storage';
import { Problem } from '../domain/problem';
import { sanitizeLoadedProblems } from '../utils/problem';

const PROBLEMS_KEY = '@comunicaplus/problems';

export async function loadStoredProblems(): Promise<Problem[]> {
  try {
    const raw = await AsyncStorage.getItem(PROBLEMS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return sanitizeLoadedProblems(parsed);
  } catch (error) {
    console.error('Erro ao carregar problemas:', error);
    return [];
  }
}

export async function saveStoredProblems(problems: Problem[]): Promise<void> {
  await AsyncStorage.setItem(PROBLEMS_KEY, JSON.stringify(problems));
}

export async function clearStoredProblems(): Promise<void> {
  await AsyncStorage.removeItem(PROBLEMS_KEY);
}