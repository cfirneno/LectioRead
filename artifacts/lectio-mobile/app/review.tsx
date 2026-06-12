import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetReview } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { SignInGate } from "@/components/SignInGate";

const KIND_LABEL: Record<string, string> = {
  translation: "Translation",
  vocab: "Vocabulary",
  grammar: "Grammar",
};

export default function ReviewScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn)
    return (
      <SignInGate
        title="Sign in to review"
        message="Your weak spots are gathered from quizzes you've taken. Sign in to track them — reading stays free."
      />
    );
  return (
    <>
      <ReviewBody />
    </>
  );
}

function ReviewBody() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const review = useGetReview();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Review</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        {review.isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : review.data ? (
          <>
            <View style={styles.intro}>
              <Text style={[styles.introTitle, { color: colors.foreground }]}>Your weak spots</Text>
              <Text style={[styles.introSub, { color: colors.mutedForeground }]}>
                Questions missed in quizzes, gathered for a second look.
              </Text>
            </View>

            {review.data.totalAttempts > 0 && (
              <View style={[styles.statsRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <View style={styles.statBlock}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {review.data.totalAttempts}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Quizzes</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBlock}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {review.data.totalPossible > 0
                      ? Math.round((review.data.totalScore / review.data.totalPossible) * 100)
                      : 0}
                    %
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Average</Text>
                </View>
              </View>
            )}

            {review.data.totalAttempts === 0 && (
              <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name="book-open" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No quizzes yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  After you finish a paragraph, tap "Quiz" to test yourself. Anything you miss
                  will land here.
                </Text>
              </View>
            )}

            {review.data.weakItems.map((item, i) => (
              <View
                key={i}
                style={[styles.itemCard, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemKind, { color: colors.mutedForeground }]}>
                    {KIND_LABEL[item.kind] ?? item.kind}
                    {item.textTitle ? ` · ${item.textTitle}` : ""}
                  </Text>
                  <Text style={[styles.itemMissed, { color: colors.mutedForeground }]}>
                    missed {item.missedCount}×
                  </Text>
                </View>
                <Text style={[styles.itemPrompt, { color: colors.foreground }]}>{item.prompt}</Text>
                {item.correctAnswer && (
                  <Text style={[styles.itemAnswer, { color: colors.foreground }]}>
                    <Text style={{ color: colors.mutedForeground }}>Correct: </Text>
                    {item.correctAnswer}
                  </Text>
                )}
                {item.explanation && (
                  <Text style={[styles.itemExplanation, { color: colors.mutedForeground }]}>
                    {item.explanation}
                  </Text>
                )}
                {item.textId !== undefined && item.paragraphIndex !== undefined && (
                  <Pressable
                    onPress={() =>
                      router.push(`/text/${item.textId}/read/${item.paragraphIndex}` as never)
                    }
                    style={({ pressed }) => [styles.itemLink, { opacity: pressed ? 0.5 : 1 }]}
                    hitSlop={8}
                  >
                    <Text style={[styles.itemLinkText, { color: colors.primary }]}>
                      Re-read this paragraph →
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}

            {review.data.totalAttempts > 0 && review.data.weakItems.length === 0 && (
              <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  Nothing to review.
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Every quiz answer was correct. Keep reading.
                </Text>
              </View>
            )}
          </>
        ) : null}
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
  headerTitle: { fontFamily: "EBGaramond_600SemiBold", fontSize: 22 },
  intro: { alignItems: "center", paddingVertical: 16 },
  introTitle: { fontFamily: "EBGaramond_600SemiBold", fontSize: 24 },
  introSub: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 18,
    marginVertical: 16,
  },
  statBlock: { flex: 1, alignItems: "center" },
  statDivider: { width: StyleSheet.hairlineWidth },
  statValue: { fontFamily: "EBGaramond_600SemiBold", fontSize: 26 },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 4, letterSpacing: 1 },
  empty: {
    padding: 28,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  emptyTitle: { fontFamily: "EBGaramond_500Medium", fontSize: 17 },
  emptyText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  itemCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  itemKind: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  itemMissed: { fontFamily: "Inter_400Regular", fontSize: 11 },
  itemPrompt: { fontFamily: "EBGaramond_500Medium", fontSize: 15, lineHeight: 21 },
  itemAnswer: { fontFamily: "EBGaramond_400Regular", fontSize: 14, marginTop: 6 },
  itemExplanation: {
    fontFamily: "EBGaramond_400Regular_Italic",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  itemLink: { marginTop: 10 },
  itemLinkText: { fontFamily: "Inter_500Medium", fontSize: 12 },
});
