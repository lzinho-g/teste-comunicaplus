import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker, MapPressEvent, Region } from "react-native-maps";
import { problemSchema, ProblemInput } from "../domain/problemSchema";
import { useProblems } from "../state/useProblems";
import { theme } from "../theme/theme";

const INITIAL_COORD = { latitude: -27.5953, longitude: -48.5485 };
const INITIAL_REGION: Region = {
  ...INITIAL_COORD,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const CATEGORY_OPTIONS = ["Buraco", "Iluminação", "Lixo", "Segurança", "Outros"];

// tipo para guardar também width/height da foto
type PickedImage = {
  uri: string;
  width: number;
  height: number;
};

export default function NewProblemScreen() {
  const [coord, setCoord] = useState(INITIAL_COORD);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  // altura dinâmica da descrição
  const [descHeight, setDescHeight] = useState(110);

  // ref do scroll para poder dar scrollTo programaticamente
  const scrollRef = useRef<ScrollView | null>(null);

  // posições (Y) de cada seção do formulário
  const sectionPositions = useRef({
    title: 0,
    category: 0,
    city: 0,
    neighborhood: 0,
    description: 0,
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProblemInput>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: "",
      category: "Buraco",
      city: "",
      neighborhood: "",
      description: "",
      latitude: INITIAL_COORD.latitude,
      longitude: INITIAL_COORD.longitude,
      image: undefined,
    },
  });

  const { addProblem } = useProblems();

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const newCoord = { latitude, longitude };
    setCoord(newCoord);
    setRegion((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));
    setValue("latitude", latitude);
    setValue("longitude", longitude);
  };

  const useMyLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();

    if (!perm.granted) {
      return Alert.alert(
        "Permissão necessária",
        "Ative o acesso à localização para usar esse recurso."
      );
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = pos.coords;
    const newCoord = { latitude, longitude };

    setCoord(newCoord);
    setRegion((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));

    setValue("latitude", latitude);
    setValue("longitude", longitude);
  };

  // 📷 Tirar foto (câmera)
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted)
      return Alert.alert("Permissão", "Ative o acesso à câmera.");

    const img = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"], // 👈 API nova (evita o warning do MediaTypeOptions)
      quality: 0.6,
    });

    if (!img.canceled) {
      const asset = img.assets[0];
      const uri = asset.uri;
      const width = asset.width ?? 1;
      const height = asset.height ?? 1;

      setImage({ uri, width, height });
      setValue("image", uri);
    }
  };

  // 🖼 Escolher da galeria
  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      return Alert.alert("Permissão", "Ative o acesso à galeria.");

    const img = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // 👈 aqui também, em vez de MediaTypeOptions.Images
      quality: 0.7,
    });

    if (!img.canceled) {
      const asset = img.assets[0];
      const uri = asset.uri;
      const width = asset.width ?? 1;
      const height = asset.height ?? 1;

      setImage({ uri, width, height });
      setValue("image", uri);
    }
  };

  // 🔹 helper para resetar tudo (usado no Enviar e no Cancelar)
  const resetForm = () => {
    reset({
      title: "",
      category: "Buraco",
      city: "",
      neighborhood: "",
      description: "",
      latitude: INITIAL_COORD.latitude,
      longitude: INITIAL_COORD.longitude,
      image: undefined,
    });

    setImage(null);
    setCoord(INITIAL_COORD);
    setRegion(INITIAL_REGION);
    setCategoryOpen(false);
    setDescHeight(110);
  };

  // ao cancelar, além de resetar o formulário, rolar para o topo
  const handleCancel = () => {
    resetForm();
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const submit = async (data: ProblemInput) => {
    const result = await addProblem(data);

    if (!result.ok) {
      Alert.alert("Erro", result.message);
      return;
    }

    Alert.alert("Sucesso!", "Problema salvo no aparelho.");

    resetForm();
  };

  // quando o formulário for inválido, rolar até o primeiro campo com erro
  const onInvalid = (formErrors: any) => {
    let targetY = 0;

    if (formErrors.title) {
      targetY = sectionPositions.current.title;
    } else if (formErrors.category) {
      targetY = sectionPositions.current.category;
    } else if (formErrors.city) {
      targetY = sectionPositions.current.city;
    } else if (formErrors.neighborhood) {
      targetY = sectionPositions.current.neighborhood;
    } else if (formErrors.description) {
      targetY = sectionPositions.current.description;
    }

    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        y: Math.max(targetY - 16, 0),
        animated: true,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.screenTitle}>Registrar problema</Text>

          {/* BLOCO TÍTULO */}
          <View
            onLayout={(e) => {
              sectionPositions.current.title = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.label}>
              Título <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helper}>
              Informe um título claro (mínimo 5 caracteres).
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  placeholder="Ex: Buraco perigoso na Rua A"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  returnKeyType="next"
                  maxLength={50}
                />
              )}
            />
            {errors.title && (
              <Text style={styles.error}>{errors.title.message}</Text>
            )}
          </View>

          {/* BLOCO CATEGORIA */}
          <View
            style={{ marginTop: 8 }}
            onLayout={(e) => {
              sectionPositions.current.category = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.label}>Categorias</Text>
            <Text style={styles.helper}>
              Toque para alterar a categoria, se necessário.
            </Text>
            <Controller
              control={control}
              name="category"
              render={({ field: { value, onChange } }) => (
                <View style={{ marginTop: 6 }}>
                  <Pressable
                    style={[styles.input, styles.categoryInput]}
                    onPress={() => setCategoryOpen((prev) => !prev)}
                  >
                    <Text
                      style={
                        value ? styles.inputText : styles.placeholderText
                      }
                    >
                      {value || "Selecione a categoria"}
                    </Text>
                    <Text style={styles.categoryChevron}>
                      {categoryOpen ? "▲" : "▼"}
                    </Text>
                  </Pressable>

                  {categoryOpen && (
                    <View style={styles.dropdown}>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <Pressable
                          key={cat}
                          style={styles.dropdownItem}
                          onPress={() => {
                            onChange(cat);
                            setCategoryOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{cat}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
            />
            {errors.category && (
              <Text style={styles.error}>{errors.category.message}</Text>
            )}
          </View>

          {/* BLOCO CIDADE */}
          <View
            style={{ marginTop: 14 }}
            onLayout={(e) => {
              sectionPositions.current.city = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.label}>
              Cidade <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helper}>
              Informe a cidade (mínimo 5 caracteres).
            </Text>
            <Controller
              control={control}
              name="city"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  placeholder="Ex: Florianópolis"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  returnKeyType="next"
                  maxLength={50}
                />
              )}
            />
            {errors.city && (
              <Text style={styles.error}>{errors.city.message}</Text>
            )}
          </View>

          {/* BLOCO BAIRRO */}
          <View
            style={{ marginTop: 14 }}
            onLayout={(e) => {
              sectionPositions.current.neighborhood = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.label}>
              Bairro <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helper}>
              Informe o bairro (mínimo 5 caracteres).
            </Text>
            <Controller
              control={control}
              name="neighborhood"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  placeholder="Ex: Centro"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={value ?? ""}
                  onChangeText={onChange}
                  returnKeyType="next"
                  maxLength={50}
                />
              )}
            />
            {errors.neighborhood && (
              <Text style={styles.error}>{errors.neighborhood.message}</Text>
            )}
          </View>

          {/* BLOCO DESCRIÇÃO */}
          <View
            style={{ marginTop: 14 }}
            onLayout={(e) => {
              sectionPositions.current.description = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.label}>
              Descrição <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helper}>
              Descreva melhor o problema (mínimo 10 caracteres).
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { value = "", onChange } }) => (
                <>
                  <TextInput
                    placeholder="Explique melhor o problema e riscos..."
                    placeholderTextColor={theme.colors.textMuted}
                    style={[
                      styles.input,
                      styles.textarea,
                      {
                        minHeight: 110,
                        height: descHeight,
                        textAlignVertical: "top",
                      },
                    ]}
                    multiline
                    value={value}
                    onChangeText={onChange}
                    onContentSizeChange={(e) => {
                      const h = e.nativeEvent.contentSize.height;
                      // cresce suave até um limite
                      if (h < 260) {
                        setDescHeight(Math.max(110, h + 4));
                      }
                    }}
                    maxLength={100}
                    returnKeyType="default"
                  />
                  <Text style={styles.charCount}>
                    {(value?.length ?? 0)}/100
                  </Text>
                </>
              )}
            />
            {errors.description && (
              <Text style={styles.error}>{errors.description.message}</Text>
            )}
          </View>

          {/* INSTRUÇÃO DO MAPA */}
          <Text
            style={{
              textAlign: "left",
              marginTop: 14,
              marginBottom: 6,
              color: theme.colors.text,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            Toque no mapa para marcar a localização do problema.
          </Text>

          {/* MAPA */}
          <MapView
            style={{ height: 220, marginVertical: 10, borderRadius: 10 }}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={onMapPress}
          >
            <Marker
              coordinate={coord}
              draggable
              onDragEnd={(e) => {
                const c = e.nativeEvent.coordinate;
                setCoord(c);
                setRegion((prev) => ({
                  ...prev,
                  latitude: c.latitude,
                  longitude: c.longitude,
                }));
                setValue("latitude", c.latitude);
                setValue("longitude", c.longitude);
              }}
            />
          </MapView>

          <Text
            style={{
              textAlign: "center",
              marginBottom: 6,
              color: theme.colors.text,
              fontSize: 12,
            }}
          >
            {coord.latitude.toFixed(5)}, {coord.longitude.toFixed(5)}
          </Text>

          <Pressable
            style={[styles.btn, styles.btnPrimaryAlone]}
            onPress={useMyLocation}
          >
            <Text style={styles.btnText}>Usar minha localização</Text>
          </Pressable>

          {/* FOTO (preview) */}
          {image && (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: image.uri }}
                style={[
                  styles.img,
                  {
                    aspectRatio:
                      image.width && image.height
                        ? image.width / image.height
                        : 4 / 3,
                  },
                ]}
                resizeMode="contain"
              />
            </View>
          )}

          {/* AÇÕES DE IMAGEM */}
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.btnDark]} onPress={takePhoto}>
              <Text style={styles.btnText}>Tirar foto</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnDark]}
              onPress={pickFromGallery}
            >
              <Text style={styles.btnText}>Escolher da galeria</Text>
            </Pressable>
          </View>

          {/* BOTÕES FINAIS: CANCELAR + ENVIAR */}
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.btn, styles.btnSecondary]}
              onPress={handleCancel}
            >
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleSubmit(submit, onInvalid)}
            >
              <Text style={styles.btnText}>Enviar</Text>
            </Pressable>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
    color: theme.colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  required: {
    color: theme.colors.danger,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  categoryInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryChevron: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginLeft: 8,
  },
  inputText: {
    color: theme.colors.text,
  },
  placeholderText: {
    color: theme.colors.textMuted,
  },
  textarea: {
    // altura base controlada via state
  },
  dropdown: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    color: theme.colors.text,
  },
  imageWrapper: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  img: {
    width: "100%",
    maxHeight: 260,
    borderRadius: 8,
  },
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  btnDark: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  // usado no "Usar minha localização", sozinho
  btnPrimaryAlone: {
    backgroundColor: theme.colors.primary,
    marginTop: 12,
  },
  // usado no par Cancelar + Enviar (sem marginTop)
  btnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  error: { color: theme.colors.danger, fontSize: 12, marginTop: 4 },
  charCount: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: "right",
    marginTop: 2,
  },
  helper: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  btnSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnSecondaryText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
});
