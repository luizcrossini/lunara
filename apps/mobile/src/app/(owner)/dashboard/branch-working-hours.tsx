import React, { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { useAuth } from "@/core/auth/auth-context";

import {
  BranchWorkingHour,
  Weekday,
  useCreateBranchWorkingHourMutation,
  useDeleteBranchWorkingHourMutation,
  useGetBranchWorkingHoursQuery,
  useUpdateBranchWorkingHourMutation,
} from "../../../features/branchworkinghours/api/branchWorkingHoursApi";

import { useGetBranchesByCompanyQuery } from "../../../features/branch/api/branchApi";

/* ============================================================

   CORES

============================================================ */

const COLORS = {
  primary: "#B5548F",

  primaryDark: "#9A4179",

  primaryLight: "#FBEEF5",

  accent: "#7967A8",

  accentLight: "#F1EDF9",

  background: "#FAF8FB",

  card: "#FFFFFF",

  text: "#221E2B",

  textSecondary: "#6C6472",

  textMuted: "#A79EAC",

  border: "#F0E8EE",

  borderStrong: "#E6DAE3",

  success: "#3E8F64",

  successLight: "#E8F6EE",

  danger: "#C0416F",

  dangerLight: "#FBE7EF",

  overlay: "rgba(34,30,43,0.45)",
};

/* ============================================================

   TIPOS

============================================================ */

type PeriodDraft = {
  id?: string;

  openTime: string;

  closeTime: string;

  sortOrder: number;
};

type DaySchedule = {
  weekday: Weekday;

  label: string;

  shortLabel: string;

  isOpen: boolean;

  periods: PeriodDraft[];
};

/* ============================================================

   DIAS

============================================================ */

const WEEKDAYS: {
  weekday: Weekday;

  label: string;

  shortLabel: string;
}[] = [
  {
    weekday: "MONDAY",

    label: "Segunda-feira",

    shortLabel: "Segunda",
  },

  {
    weekday: "TUESDAY",

    label: "Terça-feira",

    shortLabel: "Terça",
  },

  {
    weekday: "WEDNESDAY",

    label: "Quarta-feira",

    shortLabel: "Quarta",
  },

  {
    weekday: "THURSDAY",

    label: "Quinta-feira",

    shortLabel: "Quinta",
  },

  {
    weekday: "FRIDAY",

    label: "Sexta-feira",

    shortLabel: "Sexta",
  },

  {
    weekday: "SATURDAY",

    label: "Sábado",

    shortLabel: "Sábado",
  },

  {
    weekday: "SUNDAY",

    label: "Domingo",

    shortLabel: "Domingo",
  },
];

/* ============================================================

   HELPERS

============================================================ */

function createEmptySchedule(): DaySchedule[] {
  return WEEKDAYS.map((day) => ({
    ...day,

    isOpen: false,

    periods: [],
  }));
}

function normalizeTime(value?: string | null) {
  if (!value) {
    return "";
  }

  const match = String(value).match(/T?\d{4}-\d{2}-\d{2}T?(\d{2}):(\d{2})/);

  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  const timeMatch = String(value).match(/(\d{2}):(\d{2})/);

  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }

  return "";
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatTimeInput(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 4);

  if (numbers.length <= 2) {
    return numbers;
  }

  return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
}

function formatTimeForApi(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return formatTimeInput(value);
}

function getErrorMessage(error: any) {
  if (!error) {
    return "Não foi possível concluir a operação.";
  }

  const message = error?.data?.message;

  if (Array.isArray(message)) {
    return message.join("\n");
  }

  if (message) {
    return String(message);
  }

  if (error?.message) {
    return String(error.message);
  }

  return "Não foi possível concluir a operação.";
}

function buildSchedules(workingHours: BranchWorkingHour[]): DaySchedule[] {
  return WEEKDAYS.map((day) => {
    const records = workingHours

      .filter((item) => item.weekday === day.weekday)

      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }

        return normalizeTime(a.openTime).localeCompare(
          normalizeTime(b.openTime),
        );
      });

    return {
      ...day,

      isOpen: records.length > 0 && records.some((item) => item.isOpen),

      periods: records

        .filter((item) => item.isOpen)

        .map((item, index) => ({
          id: item.id,

          openTime: normalizeTime(item.openTime),

          closeTime: normalizeTime(item.closeTime),

          sortOrder: index,
        })),
    };
  });
}

/* ============================================================

   CAMPO DE HORÁRIO

============================================================ */

function TimeField({
  label,

  value,

  onChange,
}: {
  label: string;

  value: string;

  onChange: (value: string) => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  function openModal() {
    setDraftValue(value);

    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
  }

  function handleSave() {
    const formatted = formatTimeInput(draftValue);

    const minutes = timeToMinutes(formatted);

    if (formatted.length !== 5 || minutes === null) {
      Alert.alert(
        "Horário inválido",

        "Informe um horário válido no formato HH:MM. Exemplo: 08:30.",
      );

      return;
    }

    onChange(formatted);

    setModalVisible(false);
  }

  return (
    <>
      <View style={styles.timeField}>
        <Text style={styles.timeLabel}>{label}</Text>

        <Pressable style={styles.timeInputWrap} onPress={openModal}>
          <Ionicons name="time-outline" size={17} color={COLORS.textMuted} />

          <View style={styles.timeInputFake}>
            <Text
              style={[styles.timeValue, !value && styles.timeValuePlaceholder]}
            >
              {value || "--:--"}
            </Text>
          </View>

          <Ionicons name="create-outline" size={15} color={COLORS.primary} />
        </Pressable>
      </View>

      <Modal
        visible={modalVisible}

        transparent

        animationType="fade"

        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />

          <View style={styles.timeModal}>
            <View style={styles.timeModalHeader}>
              <View>
                <Text style={styles.timeModalEyebrow}>HORÁRIO</Text>

                <Text style={styles.timeModalTitle}>{label}</Text>
              </View>

              <Pressable style={styles.modalCloseButton} onPress={closeModal}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.timeModalDescription}>
              Informe o horário no formato HH:MM.
            </Text>

            <View style={styles.modalInputWrapper}>
              <Ionicons name="time-outline" size={22} color={COLORS.primary} />

              <TextInput
                value={draftValue}

                onChangeText={(text) => {
                  setDraftValue(formatTimeInput(text));
                }}

                placeholder="08:00"

                placeholderTextColor={COLORS.textMuted}

                keyboardType="numeric"

                maxLength={5}

                autoFocus

                style={styles.modalTimeInput}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={closeModal}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>

              <Pressable style={styles.modalConfirmButton} onPress={handleSave}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />

                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ============================================================

   PERÍODO

============================================================ */

function PeriodRow({
  period,

  index,

  onChangeOpen,

  onChangeClose,

  onRemove,
}: {
  period: PeriodDraft;

  index: number;

  onChangeOpen: (value: string) => void;

  onChangeClose: (value: string) => void;

  onRemove: () => void;
}) {
  return (
    <View style={styles.periodRow}>
      <View style={styles.periodIndex}>
        <Text style={styles.periodIndexText}>{index + 1}</Text>
      </View>

      <View style={styles.periodFields}>
        <TimeField
          label="Abertura"

          value={period.openTime}

          onChange={onChangeOpen}
        />

        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
        </View>

        <TimeField
          label="Fechamento"

          value={period.closeTime}

          onChange={onChangeClose}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.removePeriodButton,

          pressed && styles.pressed,
        ]}

        onPress={onRemove}

        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
      </Pressable>
    </View>
  );
}

/* ============================================================

   DIA

============================================================ */

function DayCard({
  day,

  onToggle,

  onAddPeriod,

  onRemovePeriod,

  onChangePeriod,
}: {
  day: DaySchedule;

  onToggle: () => void;

  onAddPeriod: () => void;

  onRemovePeriod: (index: number) => void;

  onChangePeriod: (
    index: number,

    field: "openTime" | "closeTime",

    value: string,
  ) => void;
}) {
  return (
    <View style={[styles.dayCard, !day.isOpen && styles.dayCardClosed]}>
      <Pressable
        style={({ pressed }) => [styles.dayHeader, pressed && styles.pressed]}

        onPress={onToggle}

        hitSlop={6}

        accessibilityRole="switch"

        accessibilityState={{ checked: day.isOpen }}

        accessibilityLabel={`${day.label}: ${
          day.isOpen ? "aberto" : "fechado"
        }`}
      >
        <View style={styles.dayIdentity}>
          <View style={[styles.dayIcon, day.isOpen && styles.dayIconOpen]}>
            <Ionicons
              name={day.isOpen ? "time-outline" : "moon-outline"}

              size={19}

              color={day.isOpen ? COLORS.primary : COLORS.textMuted}
            />
          </View>

          <View style={styles.dayTitleWrap}>
            <Text style={styles.dayTitle}>{day.label}</Text>

            <Text style={styles.daySubtitle}>
              {day.isOpen
                ? day.periods.length > 0
                  ? `${day.periods.length} ${
                      day.periods.length === 1 ? "período" : "períodos"
                    } configurado${day.periods.length === 1 ? "" : "s"}`
                  : "Nenhum período configurado"
                : "Filial fechada"}
            </Text>
          </View>
        </View>

        <View
          style={[styles.switchButton, day.isOpen && styles.switchButtonActive]}

          pointerEvents="none"
        >
          <View
            style={[styles.switchDot, day.isOpen && styles.switchDotActive]}
          />

          <Text
            style={[styles.switchText, day.isOpen && styles.switchTextActive]}
          >
            {day.isOpen ? "Aberto" : "Fechado"}
          </Text>
        </View>
      </Pressable>

      {day.isOpen && (
        <View style={styles.dayBody}>
          {day.periods.length === 0 ? (
            <View style={styles.noPeriod}>
              <Ionicons
                name="time-outline"

                size={22}

                color={COLORS.textMuted}
              />

              <Text style={styles.noPeriodText}>
                Adicione o primeiro período de atendimento.
              </Text>
            </View>
          ) : (
            day.periods.map((period, index) => (
              <PeriodRow
                key={period.id ?? `${day.weekday}-${index}`}

                period={period}

                index={index}

                onChangeOpen={(value) =>
                  onChangePeriod(index, "openTime", value)
                }

                onChangeClose={(value) =>
                  onChangePeriod(index, "closeTime", value)
                }

                onRemove={() => onRemovePeriod(index)}
              />
            ))
          )}

          <Pressable
            style={({ pressed }) => [
              styles.addPeriodButton,

              pressed && styles.pressed,
            ]}

            onPress={onAddPeriod}
          >
            <Ionicons
              name="add-circle-outline"

              size={19}

              color={COLORS.primary}
            />

            <Text style={styles.addPeriodText}>Adicionar período</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/* ============================================================

   TELA

============================================================ */

const EMPTY_WORKING_HOURS: BranchWorkingHour[] = [];

export default function BranchWorkingHoursScreen() {
  const router = useRouter();

  const { companyId } = useAuth();

  const { width } = useWindowDimensions();

  const isMobile = width < 760;

  const { data: branches = [], isLoading: branchesLoading } =
    useGetBranchesByCompanyQuery(companyId ?? "", {
      skip: !companyId,
    });

  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const {
    data: workingHoursData,
    isLoading: workingHoursLoading,
    isFetching: workingHoursFetching,
    refetch,
  } = useGetBranchWorkingHoursQuery(selectedBranchId, {
    skip: !selectedBranchId,
  });

  const workingHours = workingHoursData ?? EMPTY_WORKING_HOURS;

  const workingHoursKey = JSON.stringify(workingHours);

  const [createWorkingHour] = useCreateBranchWorkingHourMutation();

  const [updateWorkingHour] = useUpdateBranchWorkingHourMutation();

  const [deleteWorkingHour] = useDeleteBranchWorkingHourMutation();

  const [schedules, setSchedules] = useState<DaySchedule[]>(
    createEmptySchedule(),
  );

  const [saving, setSaving] = useState(false);

  /* ==========================================================

     FILIAL PADRÃO

  ========================================================== */

  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  /* ==========================================================

     CARREGA HORÁRIOS

  ========================================================== */

  useEffect(() => {
    if (!selectedBranchId) {
      setSchedules(createEmptySchedule());

      return;
    }

    setSchedules(buildSchedules(workingHoursData ?? EMPTY_WORKING_HOURS));
  }, [selectedBranchId, workingHoursKey]);

  /* ==========================================================

     FILIAL SELECIONADA

  ========================================================== */

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId),

    [branches, selectedBranchId],
  );

  /* ==========================================================

     ATUALIZAÇÃO DOS DIAS

  ========================================================== */

  function updateDay(
    weekday: Weekday,

    updater: (day: DaySchedule) => DaySchedule,
  ) {
    setSchedules((current) =>
      current.map((day) => (day.weekday === weekday ? updater(day) : day)),
    );
  }

  function toggleDay(weekday: Weekday) {
    updateDay(weekday, (day) => {
      const nextIsOpen = !day.isOpen;

      return {
        ...day,

        isOpen: nextIsOpen,

        periods:
          nextIsOpen && day.periods.length === 0
            ? [
                {
                  openTime: "08:00",

                  closeTime: "18:00",

                  sortOrder: 0,
                },
              ]
            : day.periods,
      };
    });
  }

  function addPeriod(weekday: Weekday) {
    updateDay(weekday, (day) => {
      const periods = [...day.periods].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );

      const lastPeriod = periods[periods.length - 1];

      let openTime = "13:00";

      let closeTime = "18:00";

      if (lastPeriod) {
        const lastCloseMinutes = timeToMinutes(lastPeriod.closeTime);

        if (lastCloseMinutes !== null && lastCloseMinutes < 23 * 60) {
          const suggestedOpenMinutes = lastCloseMinutes + 60;

          const hours = Math.floor(suggestedOpenMinutes / 60);

          const minutes = suggestedOpenMinutes % 60;

          openTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

          closeTime = suggestedOpenMinutes < 18 * 60 ? "18:00" : "23:00";
        }
      }

      return {
        ...day,

        isOpen: true,

        periods: [
          ...periods,

          {
            openTime,

            closeTime,

            sortOrder: periods.length,
          },
        ],
      };
    });
  }

  function removePeriod(weekday: Weekday, index: number) {
    updateDay(weekday, (day) => ({
      ...day,

      periods: day.periods

        .filter((_, periodIndex) => periodIndex !== index)

        .map((period, periodIndex) => ({
          ...period,

          sortOrder: periodIndex,
        })),
    }));
  }

  function changePeriod(
    weekday: Weekday,

    index: number,

    field: "openTime" | "closeTime",

    value: string,
  ) {
    updateDay(weekday, (day) => ({
      ...day,

      periods: day.periods.map((period, periodIndex) =>
        periodIndex === index
          ? {
              ...period,

              [field]: value,
            }
          : period,
      ),
    }));
  }

  /* ==========================================================

     VALIDAÇÃO

  ========================================================== */

  function validateSchedules() {
    for (const day of schedules) {
      if (!day.isOpen) {
        continue;
      }

      if (day.periods.length === 0) {
        return `Adicione pelo menos um período para ${day.label}.`;
      }

      const periods = day.periods

        .map((period) => ({
          ...period,

          openMinutes: timeToMinutes(period.openTime),

          closeMinutes: timeToMinutes(period.closeTime),
        }))

        .sort((a, b) => (a.openMinutes ?? 0) - (b.openMinutes ?? 0));

      for (const period of periods) {
        if (period.openMinutes === null || period.closeMinutes === null) {
          return `Informe horários válidos para ${day.label}.`;
        }

        if (period.openMinutes >= period.closeMinutes) {
          return `O horário de fechamento deve ser maior que a abertura em ${day.label}.`;
        }
      }

      for (let index = 1; index < periods.length; index++) {
        const previous = periods[index - 1];

        const current = periods[index];

        if ((current.openMinutes ?? 0) < (previous.closeMinutes ?? 0)) {
          return `Os períodos de ${day.label} não podem se sobrepor.`;
        }
      }
    }

    return null;
  }

  /* ==========================================================

     SALVAR

  ========================================================== */

  async function handleSave() {
    if (!selectedBranchId) {
      Alert.alert(
        "Filial não selecionada",

        "Selecione uma filial antes de salvar.",
      );

      return;
    }

    const validationError = validateSchedules();

    if (validationError) {
      Alert.alert("Revise os horários", validationError);

      return;
    }

    try {
      setSaving(true);

      /*

       * A configuração exibida na tela é a fonte da verdade.

       *

       * Primeiro removemos todos os períodos atuais da filial.

       * Depois recriamos exatamente os períodos configurados na tela.

       *

       * Isso evita conflitos da chave:

       * branchId + weekday + sortOrder

       *

       * E permite:

       * - vários períodos no mesmo dia;

       * - abrir novos dias;

       * - fechar dias;

       * - alterar horários;

       * - reordenar períodos;

       * - remover períodos.

       */

      const existingHours = [...workingHours];

      // 1. Remove todos os períodos atualmente salvos.

      for (const existing of existingHours) {
        await deleteWorkingHour({
          id: existing.id,

          branchId: selectedBranchId,
        }).unwrap();
      }

      // 2. Recria exatamente o que está configurado na tela.

      for (const day of schedules) {
        if (!day.isOpen || day.periods.length === 0) {
          continue;
        }

        const orderedPeriods = [...day.periods].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );

        for (let index = 0; index < orderedPeriods.length; index++) {
          const period = orderedPeriods[index];

          const openTime = formatTimeForApi(period.openTime);

          const closeTime = formatTimeForApi(period.closeTime);

          await createWorkingHour({
            branchId: selectedBranchId,

            weekday: day.weekday,

            openTime,

            closeTime,

            sortOrder: index,

            isOpen: true,
          }).unwrap();
        }
      }

      // 3. Recarrega os horários salvos.

      await refetch();

      Alert.alert(
        "Horários salvos",

        "Os horários da filial foram atualizados com sucesso.",
      );
    } catch (error) {
      console.error("Erro ao salvar horários da filial:", error);

      Alert.alert("Não foi possível salvar", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================

     LOADING

  ========================================================== */

  if (branchesLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingText}>Carregando filiais...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ==========================================================

     RENDER

  ========================================================== */

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}

        contentContainerStyle={[styles.page, isMobile && styles.pageMobile]}
      >
        {/* ====================================================

            HEADER

        ==================================================== */}

        <View style={[styles.brandBar, isMobile && styles.brandBarMobile]}>
          <View style={styles.brandMark}>
            <Ionicons name="sparkles" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>LUNARA</Text>
            <Text style={styles.brandCaption}>GESTÃO DA UNIDADE</Text>
          </View>
          {!isMobile && (
            <View style={styles.brandBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={COLORS.success}
              />
              <Text style={styles.brandBadgeText}>Configuração da filial</Text>
            </View>
          )}
        </View>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={styles.backButton}

              onPress={() => router.back()}

              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={19} color={COLORS.text} />
            </Pressable>

            <View>
              <Text style={styles.eyebrow}>CONFIGURAÇÃO DA FILIAL</Text>

              <Text style={styles.title}>Horários da filial</Text>

              <Text style={styles.subtitle}>
                Defina quando sua unidade estará disponível para receber
                agendamentos.
              </Text>
            </View>
          </View>
        </View>

        {/* ====================================================

            FILIAL

        ==================================================== */}

        <View style={styles.branchSelectorCard}>
          <View style={styles.branchSelectorIcon}>
            <Ionicons
              name="business-outline"

              size={21}

              color={COLORS.primary}
            />
          </View>

          <View style={styles.branchSelectorContent}>
            <Text style={styles.fieldLabel}>FILIAL</Text>

            <Text style={styles.selectedBranchName}>
              {selectedBranch?.name ?? "Selecione uma filial"}
            </Text>

            {selectedBranch?.address?.city && (
              <Text style={styles.selectedBranchAddress}>
                {selectedBranch.address.city} - {selectedBranch.address.state}
              </Text>
            )}
          </View>

          {branches.length > 1 && (
            <ScrollView
              horizontal

              showsHorizontalScrollIndicator={false}

              contentContainerStyle={styles.branchPills}
            >
              {branches.map((branch) => {
                const selected = branch.id === selectedBranchId;

                return (
                  <Pressable
                    key={branch.id}

                    style={[
                      styles.branchPill,

                      selected && styles.branchPillSelected,
                    ]}

                    onPress={() => setSelectedBranchId(branch.id)}
                  >
                    <Text
                      style={[
                        styles.branchPillText,

                        selected && styles.branchPillTextSelected,
                      ]}

                      numberOfLines={1}
                    >
                      {branch.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ====================================================

            EXPLICAÇÃO

        ==================================================== */}

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information-circle-outline"

              size={19}

              color={COLORS.accent}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Você pode configurar mais de um período
            </Text>

            <Text style={styles.infoText}>
              Exemplo: 08:00 às 12:00 e 13:00 às 18:00. O intervalo entre os
              períodos ficará fechado para novos agendamentos.
            </Text>
          </View>
        </View>

        {/* ====================================================

            HORÁRIOS

        ==================================================== */}

        <View
          style={[styles.summaryGrid, isMobile && styles.summaryGridMobile]}
        >
          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: COLORS.primaryLight },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryNumber}>
                {schedules.filter((day) => day.isOpen).length}
                <Text style={styles.summaryDenominator}> / 7</Text>
              </Text>
              <Text style={styles.summaryLabel}>Dias abertos</Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: COLORS.accentLight },
              ]}
            >
              <Ionicons name="time-outline" size={18} color={COLORS.accent} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryNumber}>
                {schedules.reduce(
                  (total, day) => total + (day.isOpen ? day.periods.length : 0),
                  0,
                )}
              </Text>
              <Text style={styles.summaryLabel}>Períodos configurados</Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: COLORS.successLight },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={COLORS.success}
              />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryNumber}>
                {
                  schedules.filter(
                    (day) => day.isOpen && day.periods.length > 0,
                  ).length
                }
              </Text>
              <Text style={styles.summaryLabel}>Dias prontos</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.eyebrow}>FUNCIONAMENTO</Text>

            <Text style={styles.sectionTitle}>Horários de atendimento</Text>
          </View>

          {(workingHoursLoading || workingHoursFetching) && (
            <ActivityIndicator color={COLORS.primary} size="small" />
          )}
        </View>

        {schedules.map((day) => (
          <DayCard
            key={day.weekday}

            day={day}

            onToggle={() => toggleDay(day.weekday)}

            onAddPeriod={() => addPeriod(day.weekday)}

            onRemovePeriod={(index) => removePeriod(day.weekday, index)}

            onChangePeriod={(index, field, value) =>
              changePeriod(day.weekday, index, field, value)
            }
          />
        ))}

        {/* ====================================================

            BOTÃO SALVAR

        ==================================================== */}

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,

            saving && styles.saveButtonDisabled,

            pressed && !saving && styles.pressed,
          ]}

          onPress={handleSave}

          disabled={saving || !selectedBranchId}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"

                size={20}

                color="#FFFFFF"
              />

              <Text style={styles.saveButtonText}>Salvar horários</Text>
            </>
          )}
        </Pressable>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================

   ESTILOS

============================================================ */

const styles = StyleSheet.create({
  root: {
    flex: 1,

    backgroundColor: COLORS.background,
  },

  page: {
    width: "100%",

    maxWidth: 1180,

    alignSelf: "center",

    padding: 24,

    paddingBottom: 60,
  },

  pageMobile: {
    padding: 16,
  },

  /* ==========================================================

     HEADER

  ========================================================== */

  brandBar: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 2,
    marginBottom: 20,
  },
  brandBarMobile: {
    marginBottom: 14,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: "#F4D8E8",
  },
  brandCopy: {
    flex: 1,
    gap: 2,
  },
  brandName: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 3,
  },
  brandCaption: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: "#D8EFE1",
  },
  brandBadgeText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: "800",
  },

  header: {
    marginBottom: 24,
  },

  headerLeft: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: 13,
  },

  backButton: {
    width: 42,

    height: 42,

    borderRadius: 13,

    backgroundColor: COLORS.card,

    borderWidth: 1,

    borderColor: COLORS.border,

    alignItems: "center",

    justifyContent: "center",
  },

  eyebrow: {
    color: COLORS.primary,

    fontSize: 9,

    fontWeight: "900",

    letterSpacing: 1.4,

    marginBottom: 5,
  },

  title: {
    color: COLORS.text,

    fontSize: 28,

    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.textSecondary,

    fontSize: 12,

    lineHeight: 18,

    marginTop: 6,

    maxWidth: 650,
  },

  /* ==========================================================

     FILIAL

  ========================================================== */

  branchSelectorCard: {
    backgroundColor: COLORS.card,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 20,

    padding: 18,

    flexDirection: "row",

    alignItems: "center",

    gap: 13,

    marginBottom: 14,
  },

  branchSelectorIcon: {
    width: 44,

    height: 44,

    borderRadius: 14,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",

    justifyContent: "center",
  },

  branchSelectorContent: {
    flex: 1,

    minWidth: 150,
  },

  fieldLabel: {
    color: COLORS.textMuted,

    fontSize: 8.5,

    fontWeight: "900",

    letterSpacing: 1.1,
  },

  selectedBranchName: {
    color: COLORS.text,

    fontSize: 15,

    fontWeight: "900",

    marginTop: 4,
  },

  selectedBranchAddress: {
    color: COLORS.textSecondary,

    fontSize: 10.5,

    marginTop: 2,
  },

  branchPills: {
    gap: 7,
  },

  branchPill: {
    minHeight: 36,

    paddingHorizontal: 13,

    borderRadius: 11,

    backgroundColor: COLORS.background,

    borderWidth: 1,

    borderColor: COLORS.border,

    justifyContent: "center",

    maxWidth: 180,
  },

  branchPillSelected: {
    backgroundColor: COLORS.primaryLight,

    borderColor: COLORS.primary,
  },

  branchPillText: {
    color: COLORS.textSecondary,

    fontSize: 10,

    fontWeight: "800",
  },

  branchPillTextSelected: {
    color: COLORS.primary,
  },

  /* ==========================================================

     INFO

  ========================================================== */

  infoCard: {
    backgroundColor: COLORS.accentLight,

    borderRadius: 18,

    padding: 15,

    flexDirection: "row",

    gap: 11,

    marginBottom: 28,
  },

  infoIcon: {
    width: 34,

    height: 34,

    borderRadius: 11,

    backgroundColor: "#FFFFFF",

    alignItems: "center",

    justifyContent: "center",
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: COLORS.text,

    fontSize: 11.5,

    fontWeight: "900",
  },

  infoText: {
    color: COLORS.textSecondary,

    fontSize: 10.5,

    lineHeight: 16,

    marginTop: 3,
  },

  /* ==========================================================

     SECTION

  ========================================================== */

  summaryGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  summaryGridMobile: {
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 22,
  },
  summaryCard: {
    flex: 1,
    minWidth: 145,
    minHeight: 82,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  summaryIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  summaryNumber: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },
  summaryDenominator: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 12,
  },

  sectionTitle: {
    color: COLORS.text,

    fontSize: 19,

    fontWeight: "900",
  },

  /* ==========================================================

     DAY

  ========================================================== */

  dayCard: {
    backgroundColor: COLORS.card,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 20,

    marginBottom: 12,

    overflow: "hidden",
  },

  dayCardClosed: {
    opacity: 0.82,
  },

  dayHeader: {
    minHeight: 76,

    paddingHorizontal: 17,

    paddingVertical: 12,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 12,
  },

  dayIdentity: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    gap: 11,

    minWidth: 0,
  },

  dayIcon: {
    width: 39,

    height: 39,

    borderRadius: 12,

    backgroundColor: COLORS.background,

    alignItems: "center",

    justifyContent: "center",
  },

  dayIconOpen: {
    backgroundColor: COLORS.primaryLight,
  },

  dayTitleWrap: {
    flex: 1,

    minWidth: 0,
  },

  dayTitle: {
    color: COLORS.text,

    fontSize: 13,

    fontWeight: "900",
  },

  daySubtitle: {
    color: COLORS.textSecondary,

    fontSize: 9.5,

    marginTop: 3,
  },

  switchButton: {
    minHeight: 34,

    paddingHorizontal: 10,

    borderRadius: 10,

    backgroundColor: COLORS.background,

    borderWidth: 1,

    borderColor: COLORS.border,

    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  switchButtonActive: {
    backgroundColor: COLORS.successLight,

    borderColor: "#CDE9D9",
  },

  switchDot: {
    width: 7,

    height: 7,

    borderRadius: 99,

    backgroundColor: COLORS.textMuted,
  },

  switchDotActive: {
    backgroundColor: COLORS.success,
  },

  switchText: {
    color: COLORS.textSecondary,

    fontSize: 9,

    fontWeight: "900",
  },

  switchTextActive: {
    color: COLORS.success,
  },

  dayBody: {
    borderTopWidth: 1,

    borderTopColor: COLORS.border,

    padding: 15,
  },

  /* ==========================================================

     TIME MODAL

  ========================================================== */

  timeValuePlaceholder: {
    color: COLORS.textMuted,
  },

  modalOverlay: {
    flex: 1,

    backgroundColor: COLORS.overlay,

    alignItems: "center",

    justifyContent: "center",

    padding: 20,
  },

  timeModal: {
    width: "100%",

    maxWidth: 420,

    backgroundColor: COLORS.card,

    borderRadius: 22,

    padding: 20,

    borderWidth: 1,

    borderColor: COLORS.border,

    shadowColor: "#000000",

    shadowOpacity: 0.15,

    shadowRadius: 20,

    shadowOffset: {
      width: 0,

      height: 8,
    },

    elevation: 10,
  },

  timeModalHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: 12,
  },

  timeModalEyebrow: {
    color: COLORS.primary,

    fontSize: 8.5,

    fontWeight: "900",

    letterSpacing: 1.3,

    marginBottom: 4,
  },

  timeModalTitle: {
    color: COLORS.text,

    fontSize: 20,

    fontWeight: "900",
  },

  modalCloseButton: {
    width: 34,

    height: 34,

    borderRadius: 10,

    backgroundColor: COLORS.background,

    alignItems: "center",

    justifyContent: "center",
  },

  timeModalDescription: {
    color: COLORS.textSecondary,

    fontSize: 10.5,

    lineHeight: 16,

    marginTop: 12,

    marginBottom: 14,
  },

  modalInputWrapper: {
    height: 58,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: COLORS.borderStrong,

    backgroundColor: COLORS.background,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 15,

    gap: 10,
  },

  modalTimeInput: {
    flex: 1,

    color: COLORS.text,

    fontSize: 22,

    fontWeight: "900",

    paddingVertical: 0,
  },

  modalActions: {
    flexDirection: "row",

    gap: 10,

    marginTop: 18,
  },

  modalCancelButton: {
    flex: 1,

    minHeight: 46,

    borderRadius: 12,

    backgroundColor: COLORS.background,

    borderWidth: 1,

    borderColor: COLORS.border,

    alignItems: "center",

    justifyContent: "center",
  },

  modalCancelText: {
    color: COLORS.textSecondary,

    fontSize: 11,

    fontWeight: "900",
  },

  modalConfirmButton: {
    flex: 1,

    minHeight: 46,

    borderRadius: 12,

    backgroundColor: COLORS.primary,

    alignItems: "center",

    justifyContent: "center",

    flexDirection: "row",

    gap: 7,
  },

  modalConfirmText: {
    color: "#FFFFFF",

    fontSize: 11,

    fontWeight: "900",
  },

  /* ==========================================================

     PERIOD

  ========================================================== */

  periodRow: {
    minHeight: 72,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    marginBottom: 9,
  },

  periodIndex: {
    width: 28,

    height: 28,

    borderRadius: 9,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",

    justifyContent: "center",
  },

  periodIndexText: {
    color: COLORS.primary,

    fontSize: 10,

    fontWeight: "900",
  },

  periodFields: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    gap: 9,
  },

  timeField: {
    flex: 1,

    maxWidth: 260,
  },

  timeLabel: {
    color: COLORS.textMuted,

    fontSize: 8,

    fontWeight: "900",

    marginBottom: 4,

    letterSpacing: 0.7,
  },

  timeInputWrap: {
    height: 42,

    borderRadius: 11,

    borderWidth: 1,

    borderColor: COLORS.borderStrong,

    backgroundColor: COLORS.background,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 10,

    gap: 7,
  },

  timeInputFake: {
    flex: 1,
  },

  timeValue: {
    color: COLORS.text,

    fontSize: 12,

    fontWeight: "800",
  },

  timeEditButton: {
    position: "absolute",

    right: 8,

    bottom: 8,

    width: 27,

    height: 27,

    borderRadius: 8,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",

    justifyContent: "center",
  },

  arrow: {
    marginTop: 15,
  },

  removePeriodButton: {
    width: 38,

    height: 38,

    borderRadius: 11,

    backgroundColor: COLORS.dangerLight,

    alignItems: "center",

    justifyContent: "center",
  },

  addPeriodButton: {
    minHeight: 43,

    borderRadius: 12,

    borderWidth: 1,

    borderStyle: "dashed",

    borderColor: COLORS.primary,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    flexDirection: "row",

    gap: 7,

    marginTop: 2,
  },

  addPeriodText: {
    color: COLORS.primary,

    fontSize: 10.5,

    fontWeight: "900",
  },

  noPeriod: {
    minHeight: 70,

    borderRadius: 13,

    backgroundColor: COLORS.background,

    alignItems: "center",

    justifyContent: "center",

    gap: 5,

    marginBottom: 10,
  },

  noPeriodText: {
    color: COLORS.textMuted,

    fontSize: 10,
  },

  /* ==========================================================

     SAVE

  ========================================================== */

  saveButton: {
    minHeight: 53,

    borderRadius: 15,

    backgroundColor: COLORS.primary,

    alignItems: "center",

    justifyContent: "center",

    flexDirection: "row",

    gap: 8,

    marginTop: 10,
  },

  saveButtonDisabled: {
    opacity: 0.55,
  },

  saveButtonText: {
    color: "#FFFFFF",

    fontSize: 12,

    fontWeight: "900",
  },

  /* ==========================================================

     LOADING

  ========================================================== */

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    gap: 12,
  },

  loadingText: {
    color: COLORS.textSecondary,

    fontSize: 11,
  },

  bottomSpacing: {
    height: 20,
  },

  pressed: {
    opacity: 0.72,
  },
});
