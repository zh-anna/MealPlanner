import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { MSIcon } from '@/components/ui/ms-icon';
import { UIText } from '@/components/ui/ui-text';
import { spacing } from '@/constants/tokens';
import {
  aggregateShoppingLines,
  dayIndicesFromTodayThroughWeekEnd,
  formatAmount,
  type ShoppingLine,
} from '@/lib/shopping';
import {
  dateForWeekDayIndex,
  formatWeekdayDateUk,
  weekdayIndexMondayFirst,
  WEEKDAY_LABELS_SHORT_UK,
} from '@/lib/week';
import { useMealPlanStore } from '@/stores/use-meal-plan-store';

type Scope = 'week' | 'day';

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const { menu } = useMealPlanStore();

  const todayIdx = weekdayIndexMondayFirst();
  const allowedDayIndices = useMemo(() => dayIndicesFromTodayThroughWeekEnd(todayIdx), [todayIdx]);

  const [scope, setScope] = useState<Scope>('week');
  const [pickedDay, setPickedDay] = useState(todayIdx);

  useEffect(() => {
    if (!allowedDayIndices.includes(pickedDay)) {
      setPickedDay(allowedDayIndices[0] ?? todayIdx);
    }
  }, [allowedDayIndices, pickedDay, todayIdx]);

  const activeDayIndices = useMemo(() => {
    if (scope === 'week') return allowedDayIndices;
    return pickedDay >= todayIdx && pickedDay <= 6 ? [pickedDay] : allowedDayIndices;
  }, [scope, allowedDayIndices, pickedDay, todayIdx]);

  const lines = useMemo(
    () => aggregateShoppingLines(menu, activeDayIndices),
    [menu, activeDayIndices],
  );

  const activeDaysKey = useMemo(() => activeDayIndices.join(','), [activeDayIndices]);

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setChecked({});
  }, [scope, pickedDay, activeDaysKey]);

  const toggle = (id: string) => {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  };

  const scopeLabel =
    scope === 'week'
      ? `З ${WEEKDAY_LABELS_SHORT_UK[todayIdx]} до кінця тижня`
      : `${WEEKDAY_LABELS_SHORT_UK[pickedDay]}, ${formatWeekdayDateUk(dateForWeekDayIndex(pickedDay))}`;

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      <View className="px-lg pt-xl">
        <UIText variant="h2">Покупки</UIText>
        <UIText tone="secondary" variant="caption" className="mt-xs">
          Продукти з розкладу для обраного періоду.
        </UIText>
      </View>

      <View className="mt-md px-lg">
        <View className="flex-row gap-sm">
          <ScopeChip active={scope === 'week'} label="До кінця тижня" onPress={() => setScope('week')} />
          <ScopeChip active={scope === 'day'} label="Один день" onPress={() => setScope('day')} />
        </View>
      </View>

      {scope === 'day' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-sm max-h-[48px] shrink-0 grow-0 pl-lg"
          contentContainerClassName="gap-sm pr-lg items-center">
          {allowedDayIndices.map((idx) => {
            const d = dateForWeekDayIndex(idx);
            const sel = pickedDay === idx;
            return (
              <Pressable
                key={idx}
                onPress={() => setPickedDay(idx)}
                className={[
                  'rounded-md px-md py-sm',
                  sel ? 'bg-brand-yellow' : 'bg-bg-surfaceHigh border border-border-subtle',
                ].join(' ')}>
                <UIText tone={sel ? 'inverse' : 'secondary'} variant="bodyMedium" className="text-[14px]">
                  {WEEKDAY_LABELS_SHORT_UK[idx]} {d.getDate()}
                </UIText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View className={scope === 'day' ? 'mt-xs px-lg' : 'mt-md px-lg'}>
        <UIText tone="muted" variant="caption">
          {scopeLabel}
        </UIText>
      </View>

      <ScrollView
        className="mt-md flex-1 px-lg"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 96 + spacing.xl,
        }}>
        <UIText tone="secondary" variant="label" className="mb-sm">
          {lines.length} позицій
        </UIText>

        {lines.length === 0 ? (
          <Card>
            <UIText tone="muted" variant="bodyMedium">
              Немає страв у вибраному періоді.
            </UIText>
          </Card>
        ) : (
          <Card className="overflow-hidden py-xs">
            {lines.map((line, i) => (
              <ShoppingRow
                key={line.id}
                line={line}
                checked={!!checked[line.id]}
                onToggle={() => toggle(line.id)}
                isLast={i === lines.length - 1}
              />
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScopeChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={[
        'flex-1 rounded-md px-md py-sm',
        active ? 'bg-brand-yellow' : 'border border-border-subtle bg-bg-surfaceHigh',
      ].join(' ')}>
      <UIText variant="label" tone={active ? 'inverse' : 'secondary'} className="text-center">
        {label}
      </UIText>
    </Pressable>
  );
}

function ShoppingRow({
  line,
  checked,
  onToggle,
  isLast,
}: {
  line: ShoppingLine;
  checked: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className={[
        'flex-row items-start gap-sm py-md',
        !isLast ? 'border-b border-border-subtle' : '',
      ].join(' ')}>
      <View className="pt-xs">
        <MSIcon
          name={checked ? 'check_box' : 'check_box_outline_blank'}
          tone={checked ? 'brand' : 'muted'}
          size={24}
        />
      </View>
      <View className="min-w-0 flex-1">
        <UIText variant="bodyMedium" className={checked ? 'text-text-muted line-through' : ''}>
          {line.name}
        </UIText>
        {line.note ? (
          <UIText tone="muted" variant="caption" >
            {line.note}
          </UIText>
        ) : null}
      </View>
      <UIText tone="secondary" variant="bodyMedium" className="shrink-0 pt-0.5">
        {formatAmount(line.amount)} {line.unit}
      </UIText>
    </Pressable>
  );
}
