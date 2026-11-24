import { createContext, useContext, useEffect, useState } from "react";
import { subscribeApiPending } from "../api/apiLoadingRegistry.js";

const ApiPendingContext = createContext(0);

export function ApiLoadingProvider({ children }) {
  const [pending, setPending] = useState(0);
  useEffect(() => subscribeApiPending(setPending), []);
  return <ApiPendingContext.Provider value={pending}>{children}</ApiPendingContext.Provider>;
}

export function useApiPending() {
  return useContext(ApiPendingContext);
}
