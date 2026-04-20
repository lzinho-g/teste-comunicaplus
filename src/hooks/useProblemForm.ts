import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProblems } from '../state/useProblems';
import { problemSchema, ProblemInput } from '../domain/problemSchema';

const INITIAL_COORD = { latitude: -27.5953, longitude: -48.5485 };

export function useProblemForm() {
  const { addProblem } = useProblems();

  const form = useForm<ProblemInput>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      category: 'Buraco',
      city: '',
      neighborhood: '',
      description: '',
      latitude: INITIAL_COORD.latitude,
      longitude: INITIAL_COORD.longitude,
      image: undefined,
    },
  });

  const resetFormValues = () => {
    form.reset({
      title: '',
      category: 'Buraco',
      city: '',
      neighborhood: '',
      description: '',
      latitude: INITIAL_COORD.latitude,
      longitude: INITIAL_COORD.longitude,
      image: undefined,
    });
  };

  const submitProblem = async (data: ProblemInput) => {
    const result = await addProblem(data);

    if (!result.ok) {
      Alert.alert('Erro', result.message);
      return false;
    }

    Alert.alert('Sucesso!', 'Problema salvo no aparelho.');
    return true;
  };

  return {
    ...form,
    submitProblem,
    resetFormValues,
    initialCoord: INITIAL_COORD,
  };
}