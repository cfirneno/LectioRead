import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export function SignInGate({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.body}>
        <Feather name="lock" size={32} color={colors.mutedForeground} />
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>

        <Pressable
          onPress={() => router.push("/(auth)/sign-in" as never)}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Sign in</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/sign-up" as never)}
          hitSlop={8}
          style={{ marginTop: 16 }}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>Create an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 8 },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
    gap: 14,
  },
  title: {
    fontFamily: "EBGaramond_600SemiBold",
    fontSize: 24,
    textAlign: "center",
  },
  message: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    marginTop: 12,
  },
  buttonText: { fontFamily: "EBGaramond_600SemiBold", fontSize: 17 },
  linkText: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
