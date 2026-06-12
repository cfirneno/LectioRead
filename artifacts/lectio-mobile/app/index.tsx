import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useAuth, useUser, useClerk } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useSearchText,
  useListTexts,
  useGetRecentTexts,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

const LANGUAGE_ORDER = ["Latin", "Greek", "Italian", "French", "Spanish", "German", "Russian", "Japanese"];

function normalizeLanguage(lang: string): string {
  const l = lang.trim();
  if (/^ancient\s+greek$/i.test(l) || /^greek$/i.test(l) || /^koine$/i.test(l)) return "Greek";
  return l.charAt(0).toUpperCase() + l.slice(1).toLowerCase();
}

function formatYear(y: number | null | undefined): string {
  if (y === null || y === undefined) return "—";
  if (y < 0) return `${Math.abs(y)} BCE`;
  if (y < 1000) return `${y} CE`;
  return String(y);
}

export default function HomeScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  return (
    <>
      <Library />
    </>
  );
}

function Library() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Latin: true, Greek: true });
  const [loadingQuery, setLoadingQuery] = useState<string | null>(null);

  const recent = useGetRecentTexts();
  const list = useListTexts();
  const search = useSearchText();

  const grouped = useMemo(() => {
    const g: Record<string, NonNullable<typeof list.data>> = {};
    for (const t of list.data ?? []) {
      const lang = normalizeLanguage(t.language);
      if (!g[lang]) g[lang] = [];
      g[lang].push(t);
    }
    for (const lang of Object.keys(g)) {
      g[lang].sort((a, b) => {
        const ya = a.publicationYear ?? Number.POSITIVE_INFINITY;
        const yb = b.publicationYear ?? Number.POSITIVE_INFINITY;
        if (ya !== yb) return ya - yb;
        return a.title.localeCompare(b.title);
      });
    }
    return g;
  }, [list.data]);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    setLoadingQuery(q);
    search.mutate(
      { data: { query: q } },
      {
        onSuccess: (data) => {
          setLoadingQuery(null);
          setQuery("");
          setShowSearch(false);
          router.push(`/text/${data.id}/read/0` as never);
        },
        onError: (err: unknown) => {
          setLoadingQuery(null);
          const apiErr = err as { data?: { error?: string } | null };
          Alert.alert("Couldn't load text", apiErr?.data?.error ?? "Please try again.");
        },
      },
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const refreshing = recent.isFetching || list.isFetching;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.primary }]}>Lectio</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <Pressable
            onPress={() => router.push("/review" as never)}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.5 }]}
            hitSlop={8}
          >
            <Feather name="award" size={20} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            onPress={() => setShowSearch((v) => !v)}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.5 }]}
            hitSlop={8}
          >
            <Feather name="search" size={20} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.5 }]}
            hitSlop={8}
          >
            <Feather name="log-out" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => {
              recent.refetch();
              list.refetch();
            }}
          />
        }
      >
        {showSearch && (
          <View style={[styles.searchWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. Tacitus Annals Book I"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground, borderColor: colors.border }]}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              editable={!search.isPending}
            />
            <Pressable
              onPress={handleSearch}
              disabled={search.isPending || !query.trim()}
              style={({ pressed }) => [
                styles.searchBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !query.trim() || search.isPending ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {search.isPending ? (
                <ActivityIndicator color={colors.primaryForeground} size="small" />
              ) : (
                <Text style={[styles.searchBtnText, { color: colors.primaryForeground }]}>Find</Text>
              )}
            </Pressable>
          </View>
        )}

        {search.isPending && loadingQuery && (
          <View style={[styles.loadingBanner, { backgroundColor: colors.card }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Retrieving "{loadingQuery}" from the archives…
            </Text>
          </View>
        )}

        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.primary }]}>
            A quiet room for classical reading
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            Read slowly. Read deeply.
          </Text>
        </View>

        {recent.data && recent.data.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONTINUE READING</Text>
            {recent.data.map((t) => {
              const pct = Math.round((t.completedCount / t.paragraphCount) * 100) || 0;
              const nextIndex = t.lastParagraphIndex ?? 0;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => router.push(`/text/${t.id}/read/${nextIndex}` as never)}
                  style={({ pressed }) => [
                    styles.recentCard,
                    { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.recentTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <Text style={[styles.recentAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {t.author}
                  </Text>
                  <View style={styles.progressRow}>
                    <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { backgroundColor: colors.primary, width: `${pct}%` },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                      {pct}%
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LIBRARY</Text>
          {list.isLoading && (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
          {LANGUAGE_ORDER.filter((lang) => grouped[lang]?.length).map((lang) => {
            const isOpen = !!expanded[lang];
            return (
              <View key={lang} style={[styles.langGroup, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Pressable
                  onPress={() => setExpanded((e) => ({ ...e, [lang]: !isOpen }))}
                  style={({ pressed }) => [styles.langHeader, pressed && { opacity: 0.7 }]}
                >
                  <Feather
                    name={isOpen ? "chevron-down" : "chevron-right"}
                    size={16}
                    color={colors.mutedForeground}
                  />
                  <Text style={[styles.langTitle, { color: colors.foreground }]}>{lang}</Text>
                  <Text style={[styles.langCount, { color: colors.mutedForeground }]}>
                    {grouped[lang].length}
                  </Text>
                </Pressable>
                {isOpen &&
                  grouped[lang].map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => router.push(`/text/${item.id}` as never)}
                      style={({ pressed }) => [
                        styles.bookRow,
                        { borderTopColor: colors.border, opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Text style={[styles.bookYear, { color: colors.mutedForeground }]}>
                        {formatYear(item.publicationYear)}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[styles.bookAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {item.author}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: { fontFamily: "EBGaramond_600SemiBold", fontSize: 26 },
  iconBtn: { padding: 8 },
  searchWrap: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
  },
  searchBtn: {
    height: 44,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    minWidth: 64,
  },
  searchBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  loadingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    padding: 16,
    borderRadius: 10,
  },
  loadingText: { flex: 1, fontFamily: "EBGaramond_400Regular_Italic", fontSize: 14 },
  hero: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16, alignItems: "center" },
  heroTitle: {
    fontFamily: "EBGaramond_600SemiBold",
    fontSize: 28,
    textAlign: "center",
    lineHeight: 34,
  },
  heroSubtitle: { fontFamily: "EBGaramond_400Regular_Italic", fontSize: 15, marginTop: 6 },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  recentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  recentTitle: { fontFamily: "EBGaramond_600SemiBold", fontSize: 18 },
  recentAuthor: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%" },
  progressText: { fontFamily: "Inter_500Medium", fontSize: 11, minWidth: 36, textAlign: "right" },
  langGroup: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    marginBottom: 8,
    overflow: "hidden",
  },
  langHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  langTitle: { flex: 1, fontFamily: "EBGaramond_600SemiBold", fontSize: 17 },
  langCount: { fontFamily: "Inter_400Regular", fontSize: 12 },
  bookRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bookYear: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    width: 64,
  },
  bookTitle: { fontFamily: "EBGaramond_500Medium", fontSize: 15 },
  bookAuthor: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
});
