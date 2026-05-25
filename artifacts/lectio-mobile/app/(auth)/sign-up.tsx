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
import { useSignUp } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showError = (err: unknown) => {
    const e = err as { errors?: Array<{ message?: string; longMessage?: string }> };
    setError(e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? "Something went wrong.");
  };

  const onSubmit = async () => {
    if (!isLoaded || !signUp) return;
    setError(null);
    setBusy(true);
    try {
      await signUp.create({ emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    if (!isLoaded || !signUp) return;
    setError(null);
    setBusy(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!isLoaded || !signUp) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (err) {
      showError(err);
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
        {pendingVerification ? "Verify your email" : "Create your account"}
      </Text>

      <View style={{ marginTop: 32 }}>
        {!pendingVerification ? (
          <>
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
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
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
                <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Continue</Text>
              )}
            </Pressable>

            <View nativeID="clerk-captcha" />

            <View style={styles.linkRow}>
              <Text style={[styles.linkText, { color: colors.mutedForeground }]}>Already have an account? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable hitSlop={8}>
                  <Text style={[styles.linkText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                    Sign in
                  </Text>
                </Pressable>
              </Link>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>Verification code</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              keyboardType="numeric"
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />
            {error && (
              <Text style={[styles.error, { color: colors.destructive, marginTop: 12 }]}>{error}</Text>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity: !code || busy ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
              onPress={onVerify}
              disabled={!code || busy}
            >
              {busy ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Verify</Text>
              )}
            </Pressable>
            <Pressable
              onPress={resend}
              style={{ marginTop: 16, alignItems: "center" }}
              hitSlop={8}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>Resend code</Text>
            </Pressable>
          </>
        )}
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
