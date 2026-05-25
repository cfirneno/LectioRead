import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export function AuthTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}
