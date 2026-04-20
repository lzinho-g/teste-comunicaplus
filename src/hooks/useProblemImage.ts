import { Alert } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
};

type SetImageValue = (uri: string | undefined) => void;

export function useProblemImage(setImageValue: SetImageValue) {
  const [image, setImage] = useState<PickedImage | null>(null);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Permissão', 'Ative o acesso à câmera.');
      return;
    }

    const img = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });

    if (!img.canceled) {
      const asset = img.assets[0];
      const picked = {
        uri: asset.uri,
        width: asset.width ?? 1,
        height: asset.height ?? 1,
      };

      setImage(picked);
      setImageValue(picked.uri);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Permissão', 'Ative o acesso à galeria.');
      return;
    }

    const img = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!img.canceled) {
      const asset = img.assets[0];
      const picked = {
        uri: asset.uri,
        width: asset.width ?? 1,
        height: asset.height ?? 1,
      };

      setImage(picked);
      setImageValue(picked.uri);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageValue(undefined);
  };

  return {
    image,
    takePhoto,
    pickFromGallery,
    clearImage,
    setImage,
  };
}