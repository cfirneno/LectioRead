import React, { useEffect, useState } from "react";
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
import * as Haptics from "expo-haptics";
import {
  useGetQuiz,
  useGradeQuiz,
  type PublicQuizQuestion,
  type QuizResultItem,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { SignInGate } from "@/components/SignInGate";

const KIND_LABEL: Record<string, string> = {
  translation: "Translation",
  vocab: "Vocabulary",
  grammar: "Grammar",
};

export default function QuizScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn)
    return (
      <SignInGate
        title="Sign in to take quizzes"
        message="Quizzes track what you've learned and gather your weak spots for review. Sign in to get started — reading stays free."
      />
    );
  return (
    <>
      <Quiz />
    </>
  );
}

function Quiz() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, index } = useLocalSearchParams<{ id: string; index: string }>();
  const textId = parseInt(id ?? "0", 10);
  const pIndex = parseInt(index ?? "0", 10);

  const quizMut = useGetQuiz();
  const gradeMut = useGradeQuiz();

  const [questions, setQuestions] = useState<PublicQuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; items: QuizResultItem[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    quizMut.mutate(
      { textId, index: pIndex },
      {
        onSuccess: (data) => {
          if (cancelled) return;
          setQuestions(data.questions);
        },
        onError: () => {
          if (cancelled) return;
          setLoadError("We couldn't build a quiz right now. Please try again.");
        },
      },
    );
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textId, pIndex]);

  const choose = (qid: number, idx: number) => {
    Haptics.selectionAsync().catch(() => {});
    setAnswers((a) => ({ ...a, [qid]: idx }));
  };

  const submit = () => {
    const payload = questions.map((q) => ({ id: q.id, chosenIndex: answers[q.id] ?? -1 }));
    gradeMut.mutate(
      { textId, index: pIndex, data: { answers: payload } },
      {
        onSuccess: (data) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setResult({ score: data.score, total: data.total, items: data.items });
        },
      },
    );
  };

  const allAnswered = questions.length > 0 && questions.every((q) => typeof answers[q.id] === "number");
  const currentQ = questions[current];
  const isLast = current === questions.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {result ? "How you did" : "Test yourself"}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120 }}>
        {loadError && (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 16 }}>
            <Text style={[styles.error, { color: colors.mutedForeground }]}>{loadError}</Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Back to reading</Text>
            </Pressable>
          </View>
        )}

        {quizMut.isPending && !result && (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 14 }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Writing your quiz…
            </Text>
          </View>
        )}

        {!result && currentQ && (
          <View>
            <View style={styles.qMetaRow}>
              <Text style={[styles.qMeta, { color: colors.mutedForeground }]}>
                {current + 1} of {questions.length} · {KIND_LABEL[currentQ.kind] ?? currentQ.kind}
              </Text>
              <Text style={[styles.qMeta, { color: colors.mutedForeground }]}>
                {Object.keys(answers).length}/{questions.length}
              </Text>
            </View>

            <Text style={[styles.prompt, { color: colors.foreground }]}>{currentQ.prompt}</Text>

            <View style={{ marginTop: 18, gap: 10 }}>
              {currentQ.options.map((opt, i) => {
                const selected = answers[currentQ.id] === i;
                return (
                  <Pressable
                    key={i}
                    onPress={() => choose(currentQ.id, i)}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: selected ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {result && (
          <View>
            <View style={styles.scoreBlock}>
              <Text style={[styles.score, { color: colors.primary }]}>
                {result.score}/{result.total}
              </Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
                {Math.round((result.score / result.total) * 100)}%
              </Text>
            </View>
            {result.items.map((it, i) => (
              <View
                key={i}
                style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.resultHeader}>
                  <View
                    style={[
                      styles.checkBubble,
                      { backgroundColor: it.correct ? colors.primary : colors.destructive },
                    ]}
                  >
                    <Feather name={it.correct ? "check" : "x"} size={12} color="#fff" />
                  </View>
                  <Text style={[styles.qMeta, { color: colors.mutedForeground }]}>
                    {KIND_LABEL[it.kind] ?? it.kind}
                  </Text>
                </View>
                <Text style={[styles.resultPrompt, { color: colors.foreground }]}>{it.prompt}</Text>
                <Text style={[styles.resultLine, { color: colors.foreground }]}>
                  <Text style={{ color: colors.mutedForeground }}>Your answer: </Text>
                  {it.options[it.chosenIndex] ?? "—"}
                </Text>
                {!it.correct && (
                  <Text style={[styles.resultLine, { color: colors.foreground }]}>
                    <Text style={{ color: colors.mutedForeground }}>Correct: </Text>
                    {it.options[it.correctIndex]}
                  </Text>
                )}
                {it.explanation && (
                  <Text style={[styles.resultExplanation, { color: colors.mutedForeground }]}>
                    {it.explanation}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {!result && !loadError && questions.length > 0 && (
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            {current > 0 && (
              <Pressable
                onPress={() => setCurrent((c) => c - 1)}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Feather name="arrow-left" size={18} color={colors.foreground} />
              </Pressable>
            )}
            {!isLast ? (
              <Pressable
                onPress={() => setCurrent((c) => c + 1)}
                disabled={answers[currentQ.id] === undefined}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    flex: 1,
                    opacity: answers[currentQ.id] === undefined ? 0.4 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Next</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={submit}
                disabled={!allAnswered || gradeMut.isPending}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    flex: 1,
                    opacity: !allAnswered || gradeMut.isPending ? 0.5 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                {gradeMut.isPending ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                    Submit
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      )}

      {result && (
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Done</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontFamily: "EBGaramond_600SemiBold", fontSize: 20 },
  iconBtn: { padding: 6 },
  loadingText: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 14 },
  qMetaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  qMeta: { fontFamily: "Inter_500Medium", fontSize: 12 },
  prompt: { fontFamily: "EBGaramond_500Medium", fontSize: 19, lineHeight: 27 },
  option: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionText: { fontFamily: "EBGaramond_400Regular", fontSize: 16, lineHeight: 22 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primaryBtnText: { fontFamily: "EBGaramond_600SemiBold", fontSize: 17 },
  secondaryBtn: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontFamily: "EBGaramond_500Medium", fontSize: 15 },
  error: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 14, textAlign: "center" },
  scoreBlock: { alignItems: "center", paddingVertical: 24, marginBottom: 16 },
  score: { fontFamily: "EBGaramond_600SemiBold", fontSize: 56 },
  scoreLabel: { fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 4 },
  resultCard: { padding: 16, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  checkBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resultPrompt: { fontFamily: "EBGaramond_500Medium", fontSize: 15, marginBottom: 6 },
  resultLine: { fontFamily: "EBGaramond_400Regular", fontSize: 14, marginTop: 2 },
  resultExplanation: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 13, marginTop: 8 },
});
