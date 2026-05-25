import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetText,
  useListParagraphs,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

export default function TextTocScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  return (
    <>
      <Toc />
    </>
  );
}

function Toc() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const textId = parseInt(id ?? "0", 10);

  const text = useGetText(textId, {
    query: { enabled: Number.isFinite(textId) && textId > 0 } as never,
  });
  const paragraphs = useListParagraphs(textId, {
    query: { enabled: Number.isFinite(textId) && textId > 0 } as never,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.mutedForeground }]} numberOfLines={1}>
          Library
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {text.isLoading || !text.data ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: colors.foreground }]}>{text.data.title}</Text>
              <Text style={[styles.author, { color: colors.mutedForeground }]}>{text.data.author}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {text.data.language} · {text.data.paragraphCount} paragraphs
              </Text>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
              {paragraphs.isLoading && (
                <View style={{ paddingVertical: 32, alignItems: "center" }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
              {paragraphs.data?.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/text/${textId}/read/${p.index}` as never)}
                  style={({ pressed }) => [
                    styles.paragraphRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.bullet,
                      {
                        borderColor: p.completed ? colors.primary : colors.border,
                        backgroundColor: p.completed ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    {p.completed && (
                      <Feather name="check" size={11} color={colors.primaryForeground} />
                    )}
                  </View>
                  <Text style={[styles.pIndex, { color: colors.mutedForeground }]}>
                    {p.index + 1}
                  </Text>
                  <Text
                    style={[styles.pText, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {p.originalText}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
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
  headerTitle: { fontFamily: "Inter_500Medium", fontSize: 14 },
  titleBlock: { padding: 24, alignItems: "center" },
  title: {
    fontFamily: "EBGaramond_600SemiBold",
    fontSize: 28,
    textAlign: "center",
    lineHeight: 34,
  },
  author: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 16, marginTop: 6 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 8 },
  paragraphRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    gap: 12,
  },
  bullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  pIndex: { fontFamily: "Inter_500Medium", fontSize: 12, width: 24 },
  pText: { flex: 1, fontFamily: "EBGaramond_400Regular", fontSize: 14, lineHeight: 19 },
});
