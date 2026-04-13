import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { Card } from '@/components/ui/card';
import { MSIcon } from '@/components/ui/ms-icon';
import { UIText } from '@/components/ui/ui-text';
import { colors, radius, spacing } from '@/constants/tokens';
import {
  buildVolumeSeriesMulti,
  buildWeightSeries,
  formatChartLabel,
  formatChartTooltipDate,
  parseDecimalInput,
  toISODateLocal,
} from '@/lib/body-stats-chart';
import { useBodyStatsStore } from '@/stores/use-body-stats-store';

const INPUT_CLASS =
  'rounded-md border border-border-subtle bg-bg-surface px-md py-sm font-bodyMedium text-[16px] text-text-primary';

const DATE_TRIGGER_CLASS =
  'min-h-[44px] justify-center rounded-md border border-border-subtle bg-bg-surface px-md py-sm active:opacity-90';

const CHART_Y_AXIS_W = 36;
const CHART_X_LABELS_HEIGHT = 40;
const CHART_X_LABELS_SHIFT_Y = 0;

const chartCardSurfaceStyle = {
  overflow: 'visible' as const,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.borderSubtle,
  backgroundColor: colors.surface,
  padding: spacing.sm,
};

const chartXAxisLabelTextStyle = {
  fontSize: 9,
  color: colors.textSecondary,
  textAlign: 'center' as const,
  paddingTop: spacing.sm,
};

const chartYAxisTextStyle = {
  fontSize: 10,
  color: colors.textSecondary,
  paddingRight: spacing.xs,
};

function pointerTooltipTranslateX(
  pointerIndex: number | undefined,
  pointCount: number,
  tooltipWidth: number,
) {
  if (pointerIndex === undefined || pointCount <= 0) return 0;
  if (pointerIndex === pointCount - 1) return -tooltipWidth + 12;
  const centered = -tooltipWidth / 2 + 10;
  if (pointerIndex === 0) return Math.max(centered, 6);
  return centered;
}

function chartLineSpacing(
  innerRowWidth: number,
  pointCount: number,
  startPad: number,
  endPad: number,
) {
  const scrollW = Math.max(0, innerRowWidth - CHART_Y_AXIS_W);
  const n = pointCount;
  if (n <= 1) return { scrollW, spacing: 0 };
  const denom = Math.max(1, n - 1);
  return { scrollW, spacing: Math.max(0, (scrollW - startPad - endPad) / denom) };
}

const WEIGHT_TOOLTIP_W = 140;
const VOLUME_TOOLTIP_W = 220;

export default function StatsScreen() {
  const router = useRouter();
  const { addMetrics } = useLocalSearchParams<{ addMetrics?: string }>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const hPad = spacing.md;
  const [chartRowWidth, setChartRowWidth] = useState(() =>
    Math.max(200, windowWidth - spacing.lg * 2),
  );
  const onChartRowLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setChartRowWidth(w);
  }, []);
  const modalContentWidth = windowWidth - spacing.lg * 2;
  const { entries, upsertEntry } = useBodyStatsStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [webDateStr, setWebDateStr] = useState(() => toISODateLocal(new Date()));

  const [weightStr, setWeightStr] = useState('');
  const [chestStr, setChestStr] = useState('');
  const [underStr, setUnderStr] = useState('');
  const [waistStr, setWaistStr] = useState('');
  const [hipsStr, setHipsStr] = useState('');

  const weightSeries = useMemo(() => buildWeightSeries(entries), [entries]);
  const volumeSeries = useMemo(() => buildVolumeSeriesMulti(entries), [entries]);

  const isoDate =
    Platform.OS === 'web'
      ? webDateStr.trim().match(/^\d{4}-\d{2}-\d{2}$/)
        ? webDateStr.trim()
        : toISODateLocal(date)
      : toISODateLocal(date);

  const resetForm = useCallback(() => {
    const today = new Date();
    setDate(today);
    setWebDateStr(toISODateLocal(today));
    setWeightStr('');
    setChestStr('');
    setUnderStr('');
    setWaistStr('');
    setHipsStr('');
    setShowDatePicker(false);
  }, []);

  const openModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  useEffect(() => {
    if (addMetrics !== '1' && addMetrics !== 'true') return;
    openModal();
    router.replace('/(tabs)/stats');
  }, [addMetrics, openModal, router]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setShowDatePicker(false);
  }, []);

  const onAdd = () => {
    void (async () => {
      const weightKg = parseDecimalInput(weightStr);
      const chestCm = parseDecimalInput(chestStr);
      const underbustCm = parseDecimalInput(underStr);
      const waistCm = parseDecimalInput(waistStr);
      const hipsCm = parseDecimalInput(hipsStr);

      if (
        weightKg == null &&
        chestCm == null &&
        underbustCm == null &&
        waistCm == null &&
        hipsCm == null
      ) {
        closeModal();
        return;
      }

      try {
        await upsertEntry({
          date: isoDate,
          ...(weightKg != null ? { weightKg } : {}),
          ...(chestCm != null ? { chestCm } : {}),
          ...(underbustCm != null ? { underbustCm } : {}),
          ...(waistCm != null ? { waistCm } : {}),
          ...(hipsCm != null ? { hipsCm } : {}),
        });
        resetForm();
        closeModal();
      } catch {}
    })();
  };

  const toPoints = (values: number[], labels: string[]) =>
    values.map((value, i) => ({ value, label: labels[i] ?? '' }));

  const weightGeom = useMemo(
    () => chartLineSpacing(chartRowWidth, weightSeries.length, hPad, hPad),
    [chartRowWidth, weightSeries.length, hPad],
  );

  const volumeGeom = useMemo(() => {
    const n = volumeSeries?.labels.length ?? 0;
    return chartLineSpacing(chartRowWidth, n, hPad, hPad);
  }, [chartRowWidth, volumeSeries, hPad]);

  const pointerStrip = useMemo(
    () => ({
      pointerStripColor: colors.borderSubtle,
      pointerStripWidth: 1,
      pointerStripUptoDataPoint: true,
      shiftPointerLabelY: 10,
      stripOverPointer: true,
    }),
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Статистика"
        subtitle="Динаміка ваших ваги та обʼємів."
      />
      <ScrollView
        className="flex-1 px-lg"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        contentContainerClassName="pb-xxl pt-md">
        <UIText variant="h3" className="mb-sm mt-xl">
          Вага
        </UIText>
        {weightSeries.length === 0 ? (
          <Card>
            <UIText tone="muted" variant="bodyMedium">
              Додай виміри ваги — тут зʼявиться графік.
            </UIText>
          </Card>
        ) : (
          <View style={chartCardSurfaceStyle}>
            <View onLayout={onChartRowLayout} className="overflow-hidden">
              <LineChart
                data={weightSeries}
                width={weightGeom.scrollW}
                height={200}
                yAxisLabelWidth={CHART_Y_AXIS_W}
                initialSpacing={hPad}
                endSpacing={hPad}
                spacing={weightGeom.spacing}
                focusEnabled={false}
                showDataPointOnFocus={false}
                showStripOnFocus={false}
                labelsExtraHeight={0}
                xAxisLabelsHeight={CHART_X_LABELS_HEIGHT}
                xAxisLabelsVerticalShift={CHART_X_LABELS_SHIFT_Y}
                xAxisTextNumberOfLines={2}
                color={colors.pink}
                thickness={2}
                hideDataPoints={weightSeries.length > 10}
                dataPointsColor={colors.pink}
                dataPointsRadius={4}
                xAxisLabelTextStyle={chartXAxisLabelTextStyle}
                yAxisTextStyle={chartYAxisTextStyle}
                yAxisColor={colors.borderSubtle}
                xAxisColor={colors.borderSubtle}
                rulesColor={colors.borderSubtle}
                curved
                areaChart
                startFillColor={colors.surfacePink}
                endFillColor={colors.white}
                disableScroll
                pointerConfig={{
                  ...pointerStrip,
                  pointerLabelWidth: WEIGHT_TOOLTIP_W,
                  pointerLabelHeight: 56,
                  autoAdjustPointerLabelPosition: false,
                  activatePointersInstantlyOnTouch: true,
                  pointerColor: 'transparent',
                  radius: 0,
                  width: 0,
                  height: 0,
                  pointerLabelComponent: (
                    items: { value?: number; label?: string }[],
                    _s: unknown,
                    pointerIndex: number,
                  ) => {
                    const idx =
                      typeof pointerIndex === 'number' && pointerIndex >= 0
                        ? pointerIndex
                        : 0;
                    const pt = weightSeries[idx] ?? items?.[0];
                    if (pt == null || pt.value === undefined) return null;
                    const shiftX = pointerTooltipTranslateX(
                      pointerIndex,
                      weightSeries.length,
                      WEIGHT_TOOLTIP_W,
                    );
                    return (
                      <View
                        style={{
                          width: WEIGHT_TOOLTIP_W,
                          alignItems: 'flex-start',
                          transform: [{ translateX: shiftX }],
                        }}>
                        <ChartCallout
                          title={formatChartTooltipDate(pt.date)}
                          lines={[[colors.pink, `Вага: ${pt.value.toFixed(1)} кг`]]}
                        />
                      </View>
                    );
                  },
                }}
              />
            </View>
          </View>
        )}

        <UIText variant="h3" className="mb-sm mt-xl">
          Обʼєми
        </UIText>
        {!volumeSeries ? (
          <Card>
            <UIText tone="muted" variant="bodyMedium">
              Додай хоча б один обʼєм (груди, під грудьми, талія, бедра).
            </UIText>
          </Card>
        ) : (
          <>
            <View className="mb-sm flex-row flex-wrap gap-x-md gap-y-xs">
              <Legend dot={colors.pink} label="Груди" on={volumeSeries.flags.chest} />
              <Legend dot={colors.surfacePink} label="Під грудьми" on={volumeSeries.flags.underbust} />
              <Legend dot={colors.yellow} label="Талія" on={volumeSeries.flags.waist} />
              <Legend dot={colors.black} label="Бедра" on={volumeSeries.flags.hips} />
            </View>
            <View style={chartCardSurfaceStyle}>
              <View onLayout={onChartRowLayout} className="overflow-hidden">
                <LineChart
                  data={toPoints(volumeSeries.chest, volumeSeries.labels)}
                  data2={toPoints(volumeSeries.underbust, volumeSeries.labels)}
                  data3={toPoints(volumeSeries.waist, volumeSeries.labels)}
                  data4={toPoints(volumeSeries.hips, volumeSeries.labels)}
                  width={volumeGeom.scrollW}
                  height={220}
                  yAxisLabelWidth={CHART_Y_AXIS_W}
                  initialSpacing={hPad}
                  endSpacing={hPad}
                  spacing={volumeGeom.spacing}
                  focusEnabled={false}
                  showDataPointOnFocus={false}
                  showStripOnFocus={false}
                  labelsExtraHeight={0}
                  xAxisLabelsHeight={CHART_X_LABELS_HEIGHT}
                  xAxisLabelsVerticalShift={CHART_X_LABELS_SHIFT_Y}
                  xAxisTextNumberOfLines={2}
                  color={colors.pink}
                  color2={colors.surfacePink}
                  color3={colors.yellow}
                  color4={colors.black}
                  thickness={volumeSeries.flags.chest ? 2 : 0}
                  thickness2={volumeSeries.flags.underbust ? 2 : 0}
                  thickness3={volumeSeries.flags.waist ? 2 : 0}
                  thickness4={volumeSeries.flags.hips ? 2 : 0}
                  hideDataPoints1={!volumeSeries.flags.chest}
                  hideDataPoints2={!volumeSeries.flags.underbust}
                  hideDataPoints3={!volumeSeries.flags.waist}
                  hideDataPoints4={!volumeSeries.flags.hips}
                  dataPointsColor1={colors.pink}
                  dataPointsColor2={colors.surfacePink}
                  dataPointsColor3={colors.yellow}
                  dataPointsColor4={colors.black}
                  dataPointsRadius1={4}
                  dataPointsRadius2={4}
                  dataPointsRadius3={4}
                  dataPointsRadius4={4}
                  xAxisLabelTextStyle={chartXAxisLabelTextStyle}
                  yAxisTextStyle={chartYAxisTextStyle}
                  yAxisColor={colors.borderSubtle}
                  xAxisColor={colors.borderSubtle}
                  rulesColor={colors.borderSubtle}
                  curved
                  disableScroll
                  pointerConfig={{
                    ...pointerStrip,
                    pointerLabelWidth: VOLUME_TOOLTIP_W,
                    pointerLabelHeight: 132,
                    autoAdjustPointerLabelPosition: false,
                    activatePointersInstantlyOnTouch: true,
                    pointerColor: 'transparent',
                    radius: 0,
                    width: 0,
                    height: 0,
                    pointerLabelComponent: (
                      _items: unknown,
                      _sec: unknown,
                      pointerIndex: number | undefined,
                    ) => {
                      if (
                        pointerIndex === undefined ||
                        pointerIndex < 0 ||
                        pointerIndex >= volumeSeries.labels.length
                      ) {
                        return null;
                      }
                      const iso = volumeSeries.dates[pointerIndex];
                      const c = volumeSeries.chest[pointerIndex];
                      const u = volumeSeries.underbust[pointerIndex];
                      const w = volumeSeries.waist[pointerIndex];
                      const h = volumeSeries.hips[pointerIndex];
                      const shiftX = pointerTooltipTranslateX(
                        pointerIndex,
                        volumeSeries.labels.length,
                        VOLUME_TOOLTIP_W,
                      );
                      return (
                        <View
                          style={{
                            width: VOLUME_TOOLTIP_W,
                            alignItems: 'flex-start',
                            transform: [{ translateX: shiftX }],
                          }}>
                          <ChartCallout
                            title={formatChartTooltipDate(iso)}
                            lines={[
                              [colors.pink, `Груди: ${c.toFixed(1)} см`],
                              [colors.surfacePink, `Під грудьми: ${u.toFixed(1)} см`],
                              [colors.yellow, `Талія: ${w.toFixed(1)} см`],
                              [colors.black, `Бедра: ${h.toFixed(1)} см`],
                            ]}
                          />
                        </View>
                      );
                    },
                  }}
                />
              </View>
            </View>
          </>
        )}
        <Pressable
          onPress={openModal}
          className="mt-lg items-center rounded-md bg-brand-yellow px-md py-md active:opacity-90">
          <UIText variant="bodyBold" className="text-text-primary">
            Додати нові показники
          </UIText>
        </Pressable>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}>
        <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1">
            <View className="flex-row items-center justify-between border-b border-border-subtle px-lg py-md">
              <UIText variant="h3">Нові показники</UIText>
              <Pressable
                onPress={closeModal}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Закрити">
                <MSIcon name="close" size={24} iconColor={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView
              className="flex-1 px-lg"
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="w-full items-stretch pb-xxl pt-lg">
              <View className="mb-md w-full self-stretch">
                <UIText tone="secondary" variant="label" className="mb-xs">
                  Дата
                </UIText>
                {Platform.OS === 'web' ? (
                  <TextInput
                    value={webDateStr}
                    onChangeText={setWebDateStr}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    className={INPUT_CLASS}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                ) : (
                  <>
                    <Pressable
                      onPress={() => setShowDatePicker((open) => !open)}
                      accessibilityState={{ expanded: showDatePicker }}
                      className={DATE_TRIGGER_CLASS}>
                      <UIText variant="bodyMedium">{formatChartLabel(toISODateLocal(date))}</UIText>
                    </Pressable>
                    {showDatePicker ? (
                      <ModalInlineDatePicker
                        containerWidth={modalContentWidth}
                        value={date}
                        maximumDate={new Date()}
                        onDatePicked={(d) => {
                          setDate(d);
                          setShowDatePicker(false);
                        }}
                      />
                    ) : null}
                  </>
                )}
              </View>

              <Field label="Вага (кг)" value={weightStr} onChangeText={setWeightStr} />
              <UIText variant="h3" className="mb-xs mt-sm text-text-secondary">
                Обʼєми
              </UIText>
              <Field label="Груди (см)" value={chestStr} onChangeText={setChestStr} />
              <Field label="Під грудьми (см)" value={underStr} onChangeText={setUnderStr} />
              <Field label="Талія (см)" value={waistStr} onChangeText={setWaistStr} />
              <Field label="Бедра (см)" value={hipsStr} onChangeText={setHipsStr} />

              <Pressable
                onPress={onAdd}
                className="mt-lg items-center rounded-md bg-brand-yellow px-md py-md active:opacity-90">
                <UIText variant="bodyBold" className="text-text-primary">
                  Додати
                </UIText>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ModalInlineDatePicker({
  containerWidth,
  value,
  maximumDate,
  onDatePicked,
}: {
  containerWidth: number;
  value: Date;
  maximumDate: Date;
  onDatePicked: (d: Date) => void;
}) {
  return (
    <View
      className="mt-sm overflow-hidden rounded-md border border-border-subtle bg-bg-surface"
      style={{
        width: containerWidth,
        alignSelf: 'stretch',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      }}>
      <DateTimePicker
        value={value}
        mode="date"
        display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
        onChange={(e, selected) => {
          if (e.type === 'dismissed') return;
          if (selected) onDatePicked(selected);
        }}
        maximumDate={maximumDate}
        {...(Platform.OS === 'ios'
          ? {
            themeVariant: 'light' as const,
            accentColor: colors.pink,
            textColor: colors.textPrimary,
          }
          : {})}
      />
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View className="mb-md">
      <UIText tone="secondary" variant="label" className="mb-xs">
        {label}
      </UIText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textMuted}
        className={INPUT_CLASS}
      />
    </View>
  );
}

function Legend({ dot, label, on }: { dot: string; label: string; on: boolean }) {
  return (
    <View className="flex-row items-center gap-xs">
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: on ? dot : colors.borderSubtle }} />
      <UIText tone={on ? 'primary' : 'muted'} variant="caption">
        {label}
      </UIText>
    </View>
  );
}

function ChartCallout({
  title,
  lines,
}: {
  title: string;
  lines: [string, string][];
}) {
  return (
    <View className="max-w-[220px] self-start rounded-md border border-border-subtle bg-bg-surface px-sm py-xs">
      <UIText variant="label" tone="secondary" className="text-left">
        {title}
      </UIText>
      <View className="mt-xs gap-y-1">
        {lines.map(([color, text], i) => (
          <View key={i} className="flex-row items-center gap-xs">
            <View className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <UIText variant="label" tone="primary" className="shrink text-left">
              {text}
            </UIText>
          </View>
        ))}
      </View>
    </View>
  );
}
