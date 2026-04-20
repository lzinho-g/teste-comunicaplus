import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Problem } from '../domain/problem';
import { useProblems } from '../state/useProblems';

export function useFeedAddresses(problems: Problem[]) {
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const addressesRef = useRef<Record<string, string>>({});
  const updateProblem = useProblems((state) => state.updateProblem);

  useEffect(() => {
    let active = true;

    async function loadAddresses() {
      for (const problem of problems) {
        if (!active) return;

        if (problem.address && problem.address.trim().length > 0) {
          if (addressesRef.current[problem.id]) continue;

          const next = {
            ...addressesRef.current,
            [problem.id]: problem.address,
          };

          addressesRef.current = next;
          setAddresses(next);
          continue;
        }

        if (addressesRef.current[problem.id]) continue;

        if (
          typeof problem.latitude !== 'number' ||
          Number.isNaN(problem.latitude) ||
          typeof problem.longitude !== 'number' ||
          Number.isNaN(problem.longitude)
        ) {
          continue;
        }

        try {
          const result = await Location.reverseGeocodeAsync({
            latitude: problem.latitude,
            longitude: problem.longitude,
          });

          if (!result || result.length === 0) continue;

          const first = result[0];

          const streetPart =
            first.street && first.name
              ? `${first.street}, ${first.name}`
              : first.street || first.name || '';

          const districtPart = first.district || '';
          const cityPart = first.city || first.subregion || '';

          const parts = [streetPart, districtPart, cityPart].filter(
            (item) => item && item.trim().length > 0
          );

          const formatted = parts.join(' - ');

          if (formatted && active) {
            if (addressesRef.current[problem.id]) continue;

            const next = {
              ...addressesRef.current,
              [problem.id]: formatted,
            };

            addressesRef.current = next;
            setAddresses(next);

            await updateProblem(problem.id, { address: formatted });
          }
        } catch {
          // ignora erro e mantém fallback da tela
        }
      }
    }

    loadAddresses();

    return () => {
      active = false;
    };
  }, [problems, updateProblem]);

  return addresses;
}