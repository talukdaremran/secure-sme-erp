import { createContext, useContext, useEffect, useState } from "react";
import portalApiClient from "../api/portalApiClient";

const PortalAuthContext = createContext(null);

export function PortalAuthProvider({ children }) {
  const [portalUser, setPortalUser] = useState(null);
  const [portalLoading, setPortalLoading] = useState(true);

  async function loadCurrentPortalUser() {
    const portalToken = sessionStorage.getItem("portalToken");

    if (!portalToken) {
      setPortalUser(null);
      setPortalLoading(false);
      return;
    }

    try {
      setPortalLoading(true);

      const response = await portalApiClient.get("/portal-auth/me");
      setPortalUser(response.data?.data?.portalUser || null);
    } catch (error) {
      sessionStorage.removeItem("portalToken");
      setPortalUser(null);
    } finally {
      setPortalLoading(false);
    }
  }

  async function portalLogin({ email, password, expectedRole }) {
    const response = await portalApiClient.post("/portal-auth/login", {
      email,
      password,
    });

    const token = response.data?.data?.token;
    const loggedInPortalUser = response.data?.data?.portalUser;

    if (expectedRole && loggedInPortalUser?.role !== expectedRole) {
      throw new Error(`Please use the ${loggedInPortalUser?.role} portal login page.`);
    }

    sessionStorage.setItem("portalToken", token);
    setPortalUser(loggedInPortalUser);

    return loggedInPortalUser;
  }

  function portalLogout() {
    sessionStorage.removeItem("portalToken");
    setPortalUser(null);
  }

  useEffect(() => {
    loadCurrentPortalUser();
  }, []);

  return (
    <PortalAuthContext.Provider
      value={{
        portalUser,
        portalLoading,
        portalLogin,
        portalLogout,
        loadCurrentPortalUser,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);

  if (!context) {
    throw new Error("usePortalAuth must be used inside PortalAuthProvider");
  }

  return context;
}