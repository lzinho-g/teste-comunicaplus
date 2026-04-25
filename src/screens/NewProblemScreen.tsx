import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';

import { useProblemForm } from '../hooks/useProblemForm';
import { useProblemImage } from '../hooks/useProblemImage';
import { useProblemLocation } from '../hooks/useProblemLocation';
import { ProblemInput } from '../domain/problemSchema';
import { theme } from '../theme/theme';

const CATEGORIES = [
  'Buraco',
  'Iluminação',
  'Lixo',
  'Segurança',
  'Outros',
] as const;

export default function NewProblemScreen() {
  const scrollRef = useRef<ScrollView | null>(null);

  const sectionPositions = useRef({
    title: 0,
    category: 0,
    city: 0,
    neighborhood: 0,
    description: 0,
    location: 0,
    image: 0,
  });

  const [descHeight, setDescHeight] = useState(110);

  const {
    control,
    handleSubmit,
    setValue,
    resetFormValues,
    formState: { errors },
    submitProblem,
  } = useProblemForm();

  const imageState = useProblemImage((uri) => setValue('image', uri));
  const locationState = useProblemLocation((latitude, longitude) => {
    setValue('latitude', latitude);
    setValue('longitude', longitude);
  });

  const resetAll = () => {
    resetFormValues();
    imageState.clearImage();
    locationState.resetLocation();
    setDescHeight(110);
  };

  const handleCancel = () => {
    resetAll();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const onSubmit = async (data: ProblemInput) => {
    const ok = await submitProblem(data);

    if (ok) {
      resetAll();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const onInvalid = () => {
    let targetY = 0;

    if (errors.title) targetY = sectionPositions.current.title;
    else if (errors.category) targetY = sectionPositions.current.category;
    else if (errors.city) targetY = sectionPositions.current.city;
    else if (errors.neighborhood) targetY = sectionPositions.current.neighborhood;
    else if (errors.description) targetY = sectionPositions.current.description;
    else if (errors.latitude || errors.longitude)
      targetY = sectionPositions.current.location;
    else if (errors.image) targetY = sectionPositions.current.image;

    scrollRef.current?.scrollTo({
      y: Math.max(targetY - 16, 0),
      animated: true,
    });

    Alert.alert('Campos inválidos', 'Revise os campos obrigatórios destacados.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Registrar problema</Text>
          <Text style={styles.subtitle}>
            Preencha as informações abaixo para cadastrar uma ocorrência.
          </Text>

          {/* TÍTULO */}
          <View
            onLayout={(e) => {
              sectionPositions.current.title = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            <Text style={styles.label}>Título</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="Ex.: Buraco grande na rua principal"
                  placeholderTextColor={theme.colors.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  maxLength={80}
                />
              )}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title.message}</Text>
            )}
          </View>

          {/* CATEGORIA */}
          <View
            onLayout={(e) => {
              sectionPositions.current.category = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            <Text style={styles.label}>Categoria</Text>
            <View style={[styles.pickerWrapper, errors.category && styles.inputError]}>
              <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={styles.picker}
                  >
                    {CATEGORIES.map((item) => (
                      <Picker.Item key={item} label={item} value={item} />
                    ))}
                  </Picker>
                )}
              />
            </View>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category.message}</Text>
            )}
          </View>

          {/* CIDADE */}
          <View
            onLayout={(e) => {
              sectionPositions.current.city = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            <Text style={styles.label}>Cidade</Text>
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.city && styles.inputError]}
                  placeholder="Digite a cidade"
                  placeholderTextColor={theme.colors.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  maxLength={60}
                />
              )}
            />
            {errors.city && (
              <Text style={styles.errorText}>{errors.city.message}</Text>
            )}
          </View>

          {/* BAIRRO */}
          <View
            onLayout={(e) => {
              sectionPositions.current.neighborhood = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            <Text style={styles.label}>Bairro</Text>
            <Controller
              control={control}
              name="neighborhood"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.neighborhood && styles.inputError]}
                  placeholder="Digite o bairro"
                  placeholderTextColor={theme.colors.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  maxLength={60}
                />
              )}
            />
            {errors.neighborhood && (
              <Text style={styles.errorText}>{errors.neighborhood.message}</Text>
            )}
          </View>

          {/* DESCRIÇÃO */}
          <View
            onLayout={(e) => {
              sectionPositions.current.description = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            <Text style={styles.label}>Descrição</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput
                    style={[
                      styles.textArea,
                      { height: descHeight },
                      errors.description && styles.inputError,
                    ]}
                    placeholder="Descreva o problema com o máximo de detalhes possível"
                    placeholderTextColor={theme.colors.textMuted}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                    onContentSizeChange={(e) => {
                      const nextHeight = Math.min(
                        220,
                        Math.max(110, e.nativeEvent.contentSize.height + 20)
                      );
                      setDescHeight(nextHeight);
                    }}
                  />
                  <Text style={styles.counterText}>
                    {(value ?? '').length}/500 caracteres
                  </Text>
                </>
              )}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description.message}</Text>
            )}
          </View>

          {/* LOCALIZAÇÃO */}
          <View
            onLayout={(e) => {
              sectionPositions.current.location = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            <Text style={styles.label}>Localização</Text>
            <Text style={styles.helperText}>
              Toque no mapa para ajustar o ponto da ocorrência.
            </Text>

            <MapView
              style={styles.map}
              region={locationState.region}
              onPress={locationState.onMapPress}
            >
              <Marker coordinate={locationState.coord} />
            </MapView>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={locationState.useMyLocation}
            >
              <Text style={styles.secondaryButtonText}>Usar minha localização</Text>
            </TouchableOpacity>

            {(errors.latitude || errors.longitude) && (
              <Text style={styles.errorText}>
                Defina uma localização válida para o problema.
              </Text>
            )}
          </View>

          {/* IMAGEM */}
          <View
            onLayout={(e) => {
              sectionPositions.current.image = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            <Text style={styles.label}>Imagem</Text>
            <Text style={styles.helperText}>
              Adicione uma foto para facilitar a identificação do problema.
            </Text>

            {imageState.image ? (
              <View style={styles.imagePreviewWrapper}>
                <Image source={{ uri: imageState.image.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={imageState.clearImage}
                >
                  <Text style={styles.removeImageButtonText}>Remover imagem</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  Nenhuma imagem selecionada
                </Text>
              </View>
            )}

            <View style={styles.imageButtonsRow}>
              <TouchableOpacity
                style={styles.secondaryButtonHalf}
                onPress={imageState.takePhoto}
              >
                <Text style={styles.secondaryButtonText}>Tirar foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButtonHalf}
                onPress={imageState.pickFromGallery}
              >
                <Text style={styles.secondaryButtonText}>Escolher da galeria</Text>
              </TouchableOpacity>
            </View>

            {errors.image && (
              <Text style={styles.errorText}>{errors.image.message}</Text>
            )}
          </View>

          {/* AÇÕES */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit(onSubmit, onInvalid)}
            >
              <Text style={styles.submitButtonText}>Registrar problema</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 20,
  },
  section: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.text,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: theme.colors.text,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.danger,
  },
  counterText: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  pickerWrapper: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: theme.colors.text,
  },
  map: {
    height: 220,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonHalf: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  imagePreviewWrapper: {
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
  },
  removeImageButton: {
    marginTop: 10,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  imagePlaceholder: {
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePlaceholderText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  imageButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  submitButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});