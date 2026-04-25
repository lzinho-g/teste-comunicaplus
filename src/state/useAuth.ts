import { create } from "zustand";
import { hashPassword } from "../utils/auth";
import {
  clearAuthStorage,
  getAuthSession,
  getAuthUser,
  getFirstLoginCompleted,
  removeAuthSession,
  removeAuthUser,
  removeFirstLoginCompleted,
  saveAuthSession,
  saveAuthUser,
  saveFirstLoginCompleted,
  type AuthUserRecord,
} from "../services/authStorage";

export type AuthUser = AuthUserRecord;

type RegisterInput = {
  name: string;
  cpf: string;
  phone: string;
  address: string;
  email: string;
  password: string;
};

type UpdateProfileInput = Partial<Omit<AuthUser, "passwordHash">>;

type AuthState = {
  user: AuthUser | null;
  initialized: boolean;
  loaded: boolean;
  loggedIn: boolean;
  isAuthenticated: boolean;
  firstLoginCompleted: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  load: () => Promise<void>;
  loadAuth: () => Promise<void>;
  completeFirstLogin: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
  updatePhoto: (photoUri: string | null) => Promise<void>;
  deleteAccount: () => Promise<void>;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function authFlags(isAuthenticated: boolean, loaded: boolean) {
  return {
    loggedIn: isAuthenticated,
    isAuthenticated,
    initialized: loaded,
    loaded,
  };
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  loaded: false,
  loggedIn: false,
  isAuthenticated: false,
  firstLoginCompleted: false,

  async register({ name, cpf, phone, address, email, password }) {
    try {
      const passwordHash = await hashPassword(password);

      const user: AuthUser = {
        name: name.trim(),
        cpf: cpf.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: normalizeEmail(email),
        passwordHash,
        photoUri: null,
      };

      await Promise.all([
        saveAuthUser(user),
        saveAuthSession(true),
        saveFirstLoginCompleted(false),
      ]);

      set({
        user,
        firstLoginCompleted: false,
        ...authFlags(true, true),
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      throw new Error("Não foi possível concluir o cadastro.");
    }
  },

  async login(email, password) {
    try {
      const [storedUser, firstLoginCompleted] = await Promise.all([
        getAuthUser(),
        getFirstLoginCompleted(),
      ]);

      if (!storedUser) {
        return false;
      }

      const enteredPasswordHash = await hashPassword(password);
      const sameEmail = storedUser.email.trim().toLowerCase() === normalizeEmail(email);
      const samePassword = storedUser.passwordHash === enteredPasswordHash;

      if (!sameEmail || !samePassword) {
        return false;
      }

      await saveAuthSession(true);

      set({
        user: storedUser,
        firstLoginCompleted,
        ...authFlags(true, true),
      });

      return true;
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return false;
    }
  },

  async logout() {
    try {
      await removeAuthSession();

      set({
        user: null,
        ...authFlags(false, true),
      });
    } catch (error) {
      console.error("Erro ao sair:", error);

      set({
        user: null,
        ...authFlags(false, true),
      });
    }
  },

  async load() {
    try {
      const [session, storedUser, firstLoginCompleted] = await Promise.all([
        getAuthSession(),
        getAuthUser(),
        getFirstLoginCompleted(),
      ]);

      if (session && storedUser) {
        set({
          user: storedUser,
          firstLoginCompleted,
          ...authFlags(true, true),
        });
        return;
      }

      set({
        user: null,
        firstLoginCompleted,
        ...authFlags(false, true),
      });
    } catch (error) {
      console.error("Erro ao carregar autenticação:", error);

      set({
        user: null,
        firstLoginCompleted: false,
        ...authFlags(false, true),
      });
    }
  },

  async loadAuth() {
    console.log("LOAD AUTH: iniciou");

    try {
      console.log("LOAD AUTH: antes de carregar storage");

      const [session, storedUser, firstLoginCompleted] = await Promise.all([
        getAuthSession(),
        getAuthUser(),
        getFirstLoginCompleted(),
      ]);

      console.log("LOAD AUTH: storage carregado", {
        hasSession: Boolean(session),
        hasUser: Boolean(storedUser),
        firstLoginCompleted,
      });

      if (session && storedUser) {
        console.log("LOAD AUTH: finalizando com sucesso (autenticado)");

        set({
          user: storedUser,
          firstLoginCompleted,
          ...authFlags(true, true),
        });

        console.log("LOAD AUTH: finalizou");
        return;
      }

      console.log("LOAD AUTH: finalizando com sucesso (não autenticado)");

      set({
        user: null,
        firstLoginCompleted,
        ...authFlags(false, true),
      });

      console.log("LOAD AUTH: finalizou");
    } catch (error) {
      console.error("LOAD AUTH: erro", error);

      console.log("LOAD AUTH: antes do set fallback");
      set({
        user: null,
        firstLoginCompleted: false,
        ...authFlags(false, true),
      });

      console.log("LOAD AUTH: finalizou com fallback");
    }
  },

  async completeFirstLogin() {
    try {
      await saveFirstLoginCompleted(true);
      set({ firstLoginCompleted: true });
    } catch (error) {
      console.error("Erro ao marcar primeiro acesso:", error);
    }
  },

  async updateProfile(data) {
    const currentUser = get().user;

    if (!currentUser) {
      return;
    }

    try {
      const updatedUser: AuthUser = {
        ...currentUser,
        ...data,
        email: data.email ? normalizeEmail(data.email) : currentUser.email,
        passwordHash: currentUser.passwordHash,
        photoUri:
          data.photoUri === undefined ? currentUser.photoUri : data.photoUri,
      };

      await saveAuthUser(updatedUser);

      set({ user: updatedUser });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw new Error("Não foi possível atualizar o perfil.");
    }
  },

  async updatePhoto(photoUri) {
    await get().updateProfile({ photoUri });
  },

  async deleteAccount() {
    try {
      await clearAuthStorage();

      set({
        user: null,
        firstLoginCompleted: false,
        ...authFlags(false, true),
      });
    } catch (error) {
      console.error("Erro ao excluir conta:", error);

      await Promise.all([
        removeAuthUser(),
        removeAuthSession(),
        removeFirstLoginCompleted(),
      ]);

      set({
        user: null,
        firstLoginCompleted: false,
        ...authFlags(false, true),
      });
    }
  },
}));