import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { Problem } from '../domain/problem';

export function useImageAspectRatios(problems: Problem[]) {
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

  useEffect(() => {
    problems.forEach((problem) => {
      if (!problem.image || aspectRatios[problem.id]) return;

      Image.getSize(
        problem.image,
        (width, height) => {
          if (!width || !height) return;

          setAspectRatios((prev) => {
            if (prev[problem.id]) return prev;

            return {
              ...prev,
              [problem.id]: width / height,
            };
          });
        },
        () => {
          // ignora erro de leitura da imagem
        }
      );
    });
  }, [problems, aspectRatios]);

  return aspectRatios;
}