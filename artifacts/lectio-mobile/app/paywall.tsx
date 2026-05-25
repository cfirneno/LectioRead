import React from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import { useRouter, Redirect } from "expo-router";
import { useAuth, useClerk } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import {
  useCreateCheckoutSession,
  useGetSubscriptionStatus,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

export default function PaywallScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  return <Paywall />;
}

function Paywall() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useClerk();
  const checkout = useCreateCheckoutSession();
  const sub = useGetSubscriptionStatus();

  if (sub.data?.active) {
    return <Redirect href="/" />;
  }

  const handleSubscribe = () => {
    checkout.mutate(undefined, {
      onSuccess: async (data) => {
        if (data.url) {
          await WebBrowser.openBrowserAsync(data.url);
          sub.refetch();
        }
      },
      onError: () => Alert.alert("Couldn't open checkout", "Please try again."),
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.topRow}>
        <View style={{ width: 38 }} />
        <Pressable onPress={() => sub.refetch()} hitSlop={8} style={styles.iconBtn}>
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={[styles.icon, { backgroundColor: colors.primary }]}>
          <Feather name="book-open" size={32} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.title, { color: colors.primary }]}>Lectio</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          A quiet room for classical reading
        </Text>

        <View style={[styles.features, { borderColor: colors.border }]}>
          {[
            "Original-language texts from Homer to Hugo",
            "Word-by-word and full translations",
            "5-stage progressive reading cycle",
            "Quizzes and spaced review of weak spots",
          ].map((f) => (
            <View key={f} style={styles.featureRow}>
              <Feather name="check" size={16} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleSubscribe}
          disabled={checkout.isPending}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: colors.primary,
              opacity: checkout.isPending ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {checkout.isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Subscribe</Text>
          )}
        </Pressable>

        <Text style={[styles.fine, { color: colors.mutedForeground }]}>
          Subscriptions are billed by Stripe. After paying, return to the app and tap refresh.
        </Text>

        <Pressable onPress={() => signOut()} hitSlop={8} style={{ marginTop: 24 }}>
          <Text style={[styles.signOut, { color: colors.mutedForeground }]}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBtn: { padding: 8 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontFamily: "EBGaramond_600SemiBold", fontSize: 44 },
  subtitle: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 16, marginTop: -4 },
  features: {
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 18,
    gap: 12,
    marginTop: 12,
  },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  featureText: { flex: 1, fontFamily: "EBGaramond_400Regular", fontSize: 15, lineHeight: 21 },
  cta: {
    width: "100%",
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  ctaText: { fontFamily: "EBGaramond_600SemiBold", fontSize: 17 },
  fine: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  signOut: { fontFamily: "Inter_500Medium", fontSize: 13 },
});
