import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import Loading from "../src/components/Loading";

export default function Index() {
  const { ready, loggedIn } = useAuth();
  if (!ready) return <Loading />;
  return <Redirect href={loggedIn ? "/(tabs)/garden" : "/login"} />;
}
