import { Alert } from 'react-native';
import { useState } from 'react';
import * as Location from 'expo-location';
import { MapPressEvent, Region } from 'react-native-maps';

const INITIAL_COORD = { latitude: -27.5953, longitude: -48.5485 };
const INITIAL_REGION: Region = {
  ...INITIAL_COORD,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

type SetCoordValues = (latitude: number, longitude: number) => void;

export function useProblemLocation(setCoordValues: SetCoordValues) {
  const [coord, setCoord] = useState(INITIAL_COORD);
  const [region, setRegion] = useState(INITIAL_REGION);

  const updateCoord = (latitude: number, longitude: number) => {
    setCoord({ latitude, longitude });
    setRegion((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));
    setCoordValues(latitude, longitude);
  };

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateCoord(latitude, longitude);
  };

  const useMyLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();

    if (!perm.granted) {
      Alert.alert(
        'Permissão necessária',
        'Ative o acesso à localização para usar esse recurso.'
      );
      return;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    updateCoord(pos.coords.latitude, pos.coords.longitude);
  };

  const resetLocation = () => {
    setCoord(INITIAL_COORD);
    setRegion(INITIAL_REGION);
    setCoordValues(INITIAL_COORD.latitude, INITIAL_COORD.longitude);
  };

  return {
    coord,
    region,
    onMapPress,
    useMyLocation,
    resetLocation,
  };
}