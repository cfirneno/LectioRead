import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import {
  useGetText,
  useGetParagraph,
  useGetInterlinearTranslation,
  useGetFullTranslation,
  useSaveProgress,
  type InterlinearTranslation,
  type FullTranslation,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

export default function ReadScreen() {
  return <Reader />;
}

function Reader() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const { id, index } = useLocalSearchParams<{ id: string; index: string }>();
  const textId = parseInt(id ?? "0", 10);
  const pIndex = parseInt(index ?? "0", 10);

  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [interlinear, setInterlinear] = useState<InterlinearTranslation | null>(null);
  const [fullTrans, setFullTrans] = useState<FullTranslation | null>(null);

  const text = useGetText(textId);
  const paragraph = useGetParagraph(textId, pIndex, {
    query: {
      enabled: Number.isFinite(textId) && textId > 0 && Number.isFinite(pIndex) && pIndex >= 0,
    } as never,
  });
  const interlinearMut = useGetInterlinearTranslation();
  const fullTransMut = useGetFullTranslation();
  const saveProgress = useSaveProgress();

  useEffect(() => {
    setStage(1);
    setInterlinear(null);
    setFullTrans(null);
  }, [textId, pIndex]);

  const advance = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (stage === 1) {
      interlinearMut.mutate(
        { textId, index: pIndex },
        { onSuccess: (d) => { setInterlinear(d); setStage(2); } },
      );
    } else if (stage === 2) {
      fullTransMut.mutate(
        { textId, index: pIndex },
        { onSuccess: (d) => { setFullTrans(d); setStage(3); } },
      );
    } else if (stage === 3) {
      setStage(4);
    } else if (stage === 4) {
      setStage(5);
    }
  }, [stage, textId, pIndex, interlinearMut, fullTransMut]);

  const goNext = () => {
    if (text.data && pIndex + 1 < text.data.paragraphCount) {
      router.replace(`/text/${textId}/read/${pIndex + 1}` as never);
    } else {
      router.replace(`/text/${textId}` as never);
    }
  };

  const handleGotIt = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (!isSignedIn) {
      goNext();
      return;
    }
    saveProgress.mutate(
      { data: { textId, paragraphIndex: pIndex, completed: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [`/api/texts/${textId}/paragraphs`] });
          queryClient.invalidateQueries({ queryKey: [`/api/texts/${textId}/stats`] });
          queryClient.invalidateQueries({ queryKey: [`/api/texts/recent`] });
          goNext();
        },
      },
    );
  };

  if (paragraph.isLoading || !paragraph.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Opening manuscript…
        </Text>
      </View>
    );
  }

  const isGenerating = interlinearMut.isPending || fullTransMut.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {text.data?.title ?? ""} · ¶{pIndex + 1}
        </Text>
        <View style={[styles.stageBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.stageBadgeText, { color: colors.secondaryForeground }]}>
            {stage}/5
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 140 },
        ]}
      >
        {isGenerating ? (
          <View style={{ paddingVertical: 80, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Generating translation…
            </Text>
          </View>
        ) : (
          <>
            {(stage === 1 || stage === 4 || stage === 5) && (
              <Text style={[styles.originalText, { color: colors.foreground }]}>
                {paragraph.data.originalText}
              </Text>
            )}

            {stage === 2 && interlinear && (
              <View style={styles.interlinearWrap}>
                {interlinear.words.map((w, i) => (
                  <View key={i} style={styles.wordPair}>
                    <Text style={[styles.wordOriginal, { color: colors.foreground }]}>
                      {w.original}
                    </Text>
                    {w.transliteration && (
                      <Text style={[styles.wordTranslit, { color: colors.mutedForeground }]}>
                        {w.transliteration}
                      </Text>
                    )}
                    <Text style={[styles.wordTrans, { color: colors.primary }]}>
                      {w.translation}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {stage === 3 && fullTrans && (
              <View>
                <Text style={[styles.sideLabel, { color: colors.mutedForeground }]}>
                  {text.data?.language?.toUpperCase()}
                </Text>
                <Text style={[styles.sideText, { color: colors.foreground }]}>
                  {paragraph.data.originalText}
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.sideLabel, { color: colors.mutedForeground }]}>ENGLISH</Text>
                <Text style={[styles.sideText, { color: colors.mutedForeground, fontStyle: "italic" }]}>
                  {fullTrans.translatedText}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        {!isGenerating && stage < 5 && (
          <View style={styles.footerRow}>
            {(stage === 2 || stage === 3) && (
              <Pressable
                onPress={() => setStage(stage === 2 ? 1 : 2)}
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
                hitSlop={8}
              >
                <Feather name="arrow-left" size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
            <Pressable
              onPress={advance}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                Continue
              </Text>
            </Pressable>
          </View>
        )}

        {!isGenerating && stage === 5 && (
          <View style={styles.footerRow}>
            <Pressable
              onPress={() => setStage(1)}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
                Try again
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/text/${textId}/quiz/${pIndex}` as never)}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="award" size={16} color={colors.foreground} />
              <Text style={[styles.secondaryBtnText, { color: colors.foreground, marginLeft: 6 }]}>
                Quiz
              </Text>
            </Pressable>
            <Pressable
              onPress={handleGotIt}
              disabled={saveProgress.isPending}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: saveProgress.isPending ? 0.6 : pressed ? 0.85 : 1,
                  flex: 1,
                },
              ]}
            >
              {saveProgress.isPending ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                  I got it
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 14, marginTop: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  iconBtn: { padding: 6 },
  headerTitle: {
    flex: 1,
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
  },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  stageBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  scrollContent: { padding: 24, paddingTop: 32, minHeight: "100%" },
  originalText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 24,
    lineHeight: 36,
    textAlign: "center",
  },
  interlinearWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    justifyContent: "center",
  },
  wordPair: { alignItems: "center", marginBottom: 12 },
  wordOriginal: { fontFamily: "EBGaramond_500Medium", fontSize: 22 },
  wordTranslit: { fontFamily: "Inter_400Regular", fontStyle: "italic", fontSize: 11, marginTop: 2 },
  wordTrans: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4 },
  sideLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sideText: { fontFamily: "EBGaramond_400Regular", fontSize: 19, lineHeight: 28 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 24 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { padding: 12 },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryBtnText: { fontFamily: "EBGaramond_600SemiBold", fontSize: 17 },
  secondaryBtn: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  secondaryBtnText: { fontFamily: "EBGaramond_500Medium", fontSize: 15 },
});
