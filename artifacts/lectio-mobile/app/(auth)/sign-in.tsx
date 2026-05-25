import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSignIn } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!isLoaded || !signIn) return;
    setError(null);
    setBusy(true);
    try {
      const attempt = await signIn.create({ identifier: emailAddress, password });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/");
      } else {
        setError("Additional verification required. Please use the web app to finish.");
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message?: string; longMessage?: string }> };
      setError(e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? "Couldn't sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
      ]}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.brand, { color: colors.primary }]}>Lectio</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Sign in to continue
      </Text>

      <View style={{ marginTop: 32 }}>
        <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
        <TextInput
          style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={emailAddress}
          onChangeText={setEmailAddress}
          placeholder="you@example.com"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }]}>Password</Text>
        <TextInput
          style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          secureTextEntry
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.mutedForeground}
        />

        {error && (
          <Text style={[styles.error, { color: colors.destructive, marginTop: 12 }]}>{error}</Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: !emailAddress || !password || busy ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
          onPress={onSubmit}
          disabled={!emailAddress || !password || busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Sign in</Text>
          )}
        </Pressable>

        <View style={styles.linkRow}>
          <Text style={[styles.linkText, { color: colors.mutedForeground }]}>New here? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable hitSlop={8}>
              <Text style={[styles.linkText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                Create an account
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  brand: { fontFamily: "EBGaramond_600SemiBold", fontSize: 48, textAlign: "center" },
  subtitle: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 16, textAlign: "center", marginTop: 4 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  buttonText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  linkText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  error: { fontFamily: "Inter_400Regular", fontSize: 13 },
});
