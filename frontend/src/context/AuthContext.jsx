import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const AuthContext = createContext(null);

const TOKEN_STORAGE_KEY = "token";
const SAVED_ACCOUNTS_STORAGE_KEY = "savedAccounts";

function getSavedAccountsFromStorage() {
  try {
    const savedAccounts = localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);

    if (!savedAccounts) {
      return [];
    }

    const parsedAccounts = JSON.parse(savedAccounts);

    return Array.isArray(parsedAccounts) ? parsedAccounts : [];
  } catch (error) {
    return [];
  }
}

function saveAccountsToStorage(accounts) {
  localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

function createSavedAccount(user, token) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
    token,
  };
}

function upsertSavedAccount(accounts, accountToSave) {
  const existingAccountIndex = accounts.findIndex(
    (account) =>
      account.id === accountToSave.id || account.email === accountToSave.email
  );

  if (existingAccountIndex === -1) {
    return [...accounts, accountToSave];
  }

  return accounts.map((account, index) => {
    if (index === existingAccountIndex) {
      return accountToSave;
    }

    return account;
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [savedAccounts, setSavedAccounts] = useState(
    getSavedAccountsFromStorage
  );
  const [loading, setLoading] = useState(true);

  function saveAccountSession(userToSave, token) {
    const accountToSave = createSavedAccount(userToSave, token);

    setSavedAccounts((previousAccounts) => {
      const updatedAccounts = upsertSavedAccount(
        previousAccounts,
        accountToSave
      );

      saveAccountsToStorage(updatedAccounts);

      return updatedAccounts;
    });
  }

  async function loadCurrentUser() {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get("/auth/me");
      const currentUser = response.data.data.user;

      setUser(currentUser);
      saveAccountSession(currentUser, token);
    } catch (error) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const response = await apiClient.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = response.data.data;

    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(user);
    saveAccountSession(user, token);

    return user;
  }

  async function switchAccount(accountId) {
    const accountToSwitch = savedAccounts.find(
      (account) => account.id === accountId
    );

    if (!accountToSwitch) {
      throw new Error("Saved account was not found.");
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, accountToSwitch.token);

    try {
      const response = await apiClient.get("/auth/me");
      const currentUser = response.data.data.user;

      setUser(currentUser);
      saveAccountSession(currentUser, accountToSwitch.token);

      return currentUser;
    } catch (error) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);

      setSavedAccounts((previousAccounts) => {
        const updatedAccounts = previousAccounts.filter(
          (account) => account.id !== accountId
        );

        saveAccountsToStorage(updatedAccounts);

        return updatedAccounts;
      });

      throw error;
    }
  }

  async function removeSavedAccount(accountId) {
    const updatedAccounts = savedAccounts.filter(
      (account) => account.id !== accountId
    );

    saveAccountsToStorage(updatedAccounts);
    setSavedAccounts(updatedAccounts);

    const isRemovingActiveAccount = user?.id === accountId;

    if (!isRemovingActiveAccount) {
      return user;
    }

    if (updatedAccounts.length === 0) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      return null;
    }

    const nextAccount = updatedAccounts[0];

    localStorage.setItem(TOKEN_STORAGE_KEY, nextAccount.token);

    try {
      const response = await apiClient.get("/auth/me");
      const currentUser = response.data.data.user;

      setUser(currentUser);
      saveAccountSession(currentUser, nextAccount.token);

      return currentUser;
    } catch (error) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(SAVED_ACCOUNTS_STORAGE_KEY);
      setSavedAccounts([]);
      setUser(null);

      throw error;
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(SAVED_ACCOUNTS_STORAGE_KEY);
    setSavedAccounts([]);
    setUser(null);
  }

  useEffect(() => {
    loadCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        savedAccounts,
        loading,
        login,
        logout,
        switchAccount,
        removeSavedAccount,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}