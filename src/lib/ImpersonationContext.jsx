import React, { createContext, useContext, useState, useEffect } from "react";

const ImpersonationContext = createContext();

const STORAGE_KEY = "optalflow_impersonating";

export function ImpersonationProvider({ children }) {
  const [impersonatedCompany, setImpersonatedCompany] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const startImpersonation = (company) => {
    setImpersonatedCompany(company);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(company));
  };

  const stopImpersonation = () => {
    setImpersonatedCompany(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ImpersonationContext.Provider value={{ impersonatedCompany, startImpersonation, stopImpersonation }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}