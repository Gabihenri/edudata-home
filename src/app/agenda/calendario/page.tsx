'use client';

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell';

import {
  ScheduleTemplatesPanel,
} from '@/components/agenda/ScheduleTemplatesPanel';

import {
  UpgradePrompt,
} from '@/components/commercial/UpgradePrompt';

import {
  getApiErrorMessage,
  parseUpgradeAccessResponse,
  type UpgradeAccessContext,
} from '@/lib/commercial/upgrade-access';

type ScheduleMode =
  | 'pontual'
  | 'recorrente';

type AgendaEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_at: string;
  end_at: string | null;
  status: string;
  priority: string;

  schedule_mode:
    | ScheduleMode
    | 'modelo';

  recurrence_frequency:
    | 'none'
    | 'weekly';

  recurrence_interval: number;
  recurrence_until: string | null;
  series_id: string | null;
  source_template_id: string | null;
  week_reference: string | null;
};

type EventsApiResponse = {
  success?: boolean;
  total?: number;
  message?: string;
  data?: AgendaEvent[];
  error?: string;
};

type BasicApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

type EventFormData = {
  title: string;
  description: string;
  eventType: string;
  priority: string;
  startAt: string;
  endAt: string;
  scheduleMode: ScheduleMode;
  recurrenceInterval: string;
  recurrenceUntil: string;
  saveAsTemplate: boolean;
  templateValidUntil: string;
};

type QuickAction = {
  code: string;
  label: string;
  title: string;
  description: string;
  mode?: ScheduleMode;
  action:
    | 'form'
    | 'next-week';
};

type SummaryCardProps = {
  label: string;
  value: number;
  description: string;
  className?: string;
};

const TIMEZONE =
  'America/Sao_Paulo';

const MAX_DELETION_REASON_LENGTH =
  500;

const timePresets = [
  {
    label:
      'Escolher manualmente',
    value:
      'custom',
  },
  {
    label:
      '07h00 às 07h50',
    value:
      '07:00|07:50',
  },
  {
    label:
      '13h00 às 13h50',
    value:
      '13:00|13:50',
  },
  {
    label:
      '14h20 às 15h10',
    value:
      '14:20|15:10',
  },
  {
    label:
      '15h10 às 16h00',
    value:
      '15:10|16:00',
  },
  {
    label:
      '18h50 às 19h40',
    value:
      '18:50|19:40',
  },
  {
    label:
      '19h40 às 20h30',
    value:
      '19:40|20:30',
  },
];

const quickActions:
  QuickAction[] = [
    {
      code:
        '01',
      label:
        'Pontual',
      title:
        'Novo evento',
      description:
        'Registre uma ação específica em uma única data e horário.',
      mode:
        'pontual',
      action:
        'form',
    },
    {
      code:
        '02',
      label:
        'Recorrência',
      title:
        'Repetir horário',
      description:
        'Gere o mesmo compromisso automaticamente nas próximas semanas.',
      mode:
        'recorrente',
      action:
        'form',
    },
    {
      code:
        '03',
      label:
        'Antecipação',
      title:
        'Próxima semana',
      description:
        'Avance para organizar antecipadamente o próximo período semanal.',
      action:
        'next-week',
    },
  ];

const inputClassName = [
  'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3',
  'text-slate-950 outline-none transition placeholder:text-slate-400',
  'focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100',
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
].join(' ');

function SummaryCard({
  label,
  value,
  description,
  className,
}: SummaryCardProps) {
  return (
    <article
      className={[
        'p-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-[#071827]">
        {value}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </article>
  );
}

function padNumber(
  value: number,
): string {
  return String(
    value,
  ).padStart(
    2,
    '0',
  );
}

function formatDateInput(
  date: Date,
): string {
  return [
    date.getFullYear(),

    padNumber(
      date.getMonth() +
        1,
    ),

    padNumber(
      date.getDate(),
    ),
  ].join('-');
}

function parseDateInput(
  value: string,
): Date {
  const [
    year,
    month,
    day,
  ] =
    value
      .split('-')
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0,
  );
}

function addDays(
  date: Date,
  numberOfDays: number,
): Date {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() +
      numberOfDays,
  );

  return result;
}

function addWeeksToDateInput(
  dateInput: string,
  weeks: number,
): string {
  return formatDateInput(
    addDays(
      parseDateInput(
        dateInput,
      ),
      weeks * 7,
    ),
  );
}

function getWeekReference(
  date: Date,
): string {
  const result =
    new Date(date);

  result.setHours(
    12,
    0,
    0,
    0,
  );

  const weekday =
    result.getDay() === 0
      ? 7
      : result.getDay();

  result.setDate(
    result.getDate() -
      weekday +
      1,
  );

  return formatDateInput(
    result,
  );
}

function getWeekdayFromDateInput(
  dateInput: string,
): number {
  const weekday =
    parseDateInput(
      dateInput,
    ).getDay();

  return weekday === 0
    ? 7
    : weekday;
}

function formatWeekLabel(
  weekReference: string,
): string {
  const startDate =
    parseDateInput(
      weekReference,
    );

  const endDate =
    addDays(
      startDate,
      6,
    );

  const formatter =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        day:
          '2-digit',

        month:
          'long',

        year:
          'numeric',
      },
    );

  return `${formatter.format(
    startDate,
  )} a ${formatter.format(
    endDate,
  )}`;
}

function formatEventDateTime(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data não informada';
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone:
        TIMEZONE,

      weekday:
        'short',

      day:
        '2-digit',

      month:
        '2-digit',

      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  ).format(date);
}

function formatLabel(
  value: string,
): string {
  return value
    .replace(
      /_/g,
      ' ',
    )
    .replace(
      /-/g,
      ' ',
    )
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase(),
    );
}

function getEventTypeLabel(
  value: string,
): string {
  const labels:
    Record<string, string> = {
      pedagogico:
        'Pedagógico',

      aula:
        'Aula',

      reuniao:
        'Reunião',

      formacao:
        'Formação',

      avaliacao:
        'Avaliação',

      prazo:
        'Prazo',

      acompanhamento:
        'Acompanhamento',

      outro:
        'Outro',
    };

  return (
    labels[value] ??
    formatLabel(value)
  );
}

function getPriorityLabel(
  value: string,
): string {
  const labels:
    Record<string, string> = {
      baixa:
        'Baixa',

      media:
        'Média',

      alta:
        'Alta',

      urgente:
        'Urgente',
    };

  return (
    labels[value] ??
    formatLabel(value)
  );
}

function getPriorityClasses(
  value: string,
): string {
  if (
    value === 'alta' ||
    value === 'urgente'
  ) {
    return [
      'border-red-200',
      'bg-red-50',
      'text-red-800',
    ].join(' ');
  }

  if (
    value === 'media'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-800',
    ].join(' ');
  }

  return [
    'border-emerald-200',
    'bg-emerald-50',
    'text-emerald-800',
  ].join(' ');
}

function getScheduleModeLabel(
  agendaEvent: AgendaEvent,
): string {
  if (
    agendaEvent
      .source_template_id
  ) {
    return 'Horário-padrão';
  }

  if (
    agendaEvent
      .schedule_mode ===
    'recorrente'
  ) {
    return 'Semanal';
  }

  return 'Pontual';
}

function getScheduleModeClasses(
  agendaEvent: AgendaEvent,
): string {
  if (
    agendaEvent
      .source_template_id
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-800',
    ].join(' ');
  }

  if (
    agendaEvent
      .schedule_mode ===
    'recorrente'
  ) {
    return [
      'border-blue-200',
      'bg-blue-50',
      'text-blue-800',
    ].join(' ');
  }

  return [
    'border-slate-200',
    'bg-slate-50',
    'text-slate-700',
  ].join(' ');
}

function createInitialForm(
  weekReference: string,
  scheduleMode: ScheduleMode,
): EventFormData {
  return {
    title:
      '',

    description:
      '',

    eventType:
      'pedagogico',

    priority:
      'media',

    startAt:
      `${weekReference}T14:20`,

    endAt:
      `${weekReference}T15:10`,

    scheduleMode,

    recurrenceInterval:
      '1',

    recurrenceUntil:
      addWeeksToDateInput(
        weekReference,
        8,
      ),

    saveAsTemplate:
      false,

    templateValidUntil:
      addWeeksToDateInput(
        weekReference,
        16,
      ),
  };
}

async function readJsonResponse<T>(
  response: Response,
): Promise<T> {
  try {
    return (
      await response.json()
    ) as T;
  } catch {
    throw new Error(
      'A resposta do servidor é inválida.',
    );
  }
}

function normalizePayload<T>(
  payload: unknown,
): T {
  if (
    typeof payload ===
      'object' &&
    payload !== null &&
    !Array.isArray(
      payload,
    )
  ) {
    return payload as T;
  }

  return {} as T;
}

export default function AgendaCalendarPage() {
  const formSectionRef =
    useRef<HTMLElement | null>(
      null,
    );

  const eventsSectionRef =
    useRef<HTMLElement | null>(
      null,
    );

  const [
    selectedWeek,
    setSelectedWeek,
  ] =
    useState(() =>
      getWeekReference(
        new Date(),
      ),
    );

  const [
    events,
    setEvents,
  ] =
    useState<AgendaEvent[]>(
      [],
    );

  const [
    formData,
    setFormData,
  ] =
    useState<EventFormData>(
      () =>
        createInitialForm(
          getWeekReference(
            new Date(),
          ),
          'pontual',
        ),
    );

  const [
    selectedPreset,
    setSelectedPreset,
  ] =
    useState(
      '14:20|15:10',
    );

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    deletingEventId,
    setDeletingEventId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState('');

  const [
    warningMessage,
    setWarningMessage,
  ] =
    useState('');

  const [
    recurringUpgradeAccess,
    setRecurringUpgradeAccess,
  ] =
    useState<
      UpgradeAccessContext |
      null
    >(null);

  const [
    templatesRefreshKey,
    setTemplatesRefreshKey,
  ] =
    useState(0);

  const summary =
    useMemo(() => {
      const recurring =
        events.filter(
          agendaEvent =>
            agendaEvent
              .schedule_mode ===
            'recorrente',
        ).length;

      const fromTemplates =
        events.filter(
          agendaEvent =>
            Boolean(
              agendaEvent
                .source_template_id,
            ),
        ).length;

      const highPriority =
        events.filter(
          agendaEvent =>
            agendaEvent.priority ===
              'alta' ||
            agendaEvent.priority ===
              'urgente',
        ).length;

      return {
        total:
          events.length,

        recurring,

        fromTemplates,

        highPriority,
      };
    }, [
      events,
    ]);

  const clearMessages =
    useCallback(() => {
      setErrorMessage(
        '',
      );

      setSuccessMessage(
        '',
      );

      setWarningMessage(
        '',
      );

      setRecurringUpgradeAccess(
        null,
      );
    }, []);

  const loadEvents =
    useCallback(
      async () => {
        setIsLoading(
          true,
        );

        setErrorMessage(
          '',
        );

        try {
          const response =
            await fetch(
              `/api/agenda/events?weekReference=${encodeURIComponent(
                selectedWeek,
              )}`,
              {
                method:
                  'GET',

                credentials:
                  'include',

                cache:
                  'no-store',
              },
            );

          const payload =
            await readJsonResponse<unknown>(
              response,
            );

          const result =
            normalizePayload<
              EventsApiResponse
            >(payload);

          if (
            !response.ok ||
            result.success !==
              true
          ) {
            throw new Error(
              getApiErrorMessage(
                payload,
                'Não foi possível carregar a semana.',
              ),
            );
          }

          setEvents(
            result.data ??
              [],
          );
        } catch (error) {
          setEvents(
            [],
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os eventos.',
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      },
      [
        selectedWeek,
      ],
    );

  useEffect(() => {
    void loadEvents();
  }, [
    loadEvents,
  ]);

  function updateFormField(
    field: Exclude<
      keyof EventFormData,
      'saveAsTemplate'
    >,
    value: string,
  ): void {
    setFormData(
      current => ({
        ...current,
        [field]:
          value,
      }),
    );

    clearMessages();
  }

  function selectWeek(
    weekReference: string,
  ): void {
    setSelectedWeek(
      weekReference,
    );

    clearMessages();
  }

  function selectCurrentWeek():
    void {
    selectWeek(
      getWeekReference(
        new Date(),
      ),
    );
  }

  function selectNextWeek():
    void {
    selectWeek(
      addWeeksToDateInput(
        getWeekReference(
          new Date(),
        ),
        1,
      ),
    );
  }

  function moveWeek(
    direction: number,
  ): void {
    selectWeek(
      addWeeksToDateInput(
        selectedWeek,
        direction,
      ),
    );
  }

  function openEventForm(
    scheduleMode: ScheduleMode,
  ): void {
    setFormData(
      createInitialForm(
        selectedWeek,
        scheduleMode,
      ),
    );

    setSelectedPreset(
      '14:20|15:10',
    );

    clearMessages();

    setShowForm(
      true,
    );

    window.setTimeout(
      () => {
        formSectionRef
          .current
          ?.scrollIntoView({
            behavior:
              'smooth',

            block:
              'start',
          });
      },
      50,
    );
  }

  function applyTimePreset(
    value: string,
  ): void {
    setSelectedPreset(
      value,
    );

    if (
      value ===
      'custom'
    ) {
      return;
    }

    const [
      startTime,
      endTime,
    ] =
      value.split('|');

    const selectedDate =
      formData.startAt.slice(
        0,
        10,
      ) ||
      selectedWeek;

    setFormData(
      current => ({
        ...current,

        startAt:
          `${selectedDate}T${startTime}`,

        endAt:
          `${selectedDate}T${endTime}`,
      }),
    );

    clearMessages();
  }

  async function saveScheduleTemplate():
    Promise<string> {
    const eventDate =
      formData.startAt.slice(
        0,
        10,
      );

    const startTime =
      formData.startAt.slice(
        11,
        16,
      );

    const endTime =
      formData.endAt
        ? formData.endAt.slice(
            11,
            16,
          )
        : null;

    const response =
      await fetch(
        '/api/agenda/schedule-templates',
        {
          method:
            'POST',

          credentials:
            'include',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              title:
                formData.title.trim(),

              description:
                formData.description
                  .trim() ||
                null,

              eventType:
                formData.eventType,

              priority:
                formData.priority,

              weekday:
                getWeekdayFromDateInput(
                  eventDate,
                ),

              startTime,

              endTime,

              timezone:
                TIMEZONE,

              repeatIntervalWeeks:
                1,

              validFrom:
                eventDate,

              validUntil:
                formData
                  .templateValidUntil ||
                null,
            }),
        },
      );

    const payload =
      await readJsonResponse<unknown>(
        response,
      );

    const result =
      normalizePayload<
        BasicApiResponse
      >(payload);

    if (
      !response.ok ||
      result.success !==
        true
    ) {
      throw new Error(
        getApiErrorMessage(
          payload,
          'Não foi possível guardar o horário-padrão.',
        ),
      );
    }

    setTemplatesRefreshKey(
      current =>
        current + 1,
    );

    return (
      result.message ??
      'Horário-padrão salvo.'
    );
  }

  async function handleCreateEvent(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    clearMessages();

    const title =
      formData.title.trim();

    if (!title) {
      setErrorMessage(
        'Informe o título do evento.',
      );

      return;
    }

    if (
      !formData.startAt
    ) {
      setErrorMessage(
        'Informe a data e o horário inicial.',
      );

      return;
    }

    const startDate =
      new Date(
        formData.startAt,
      );

    const endDate =
      formData.endAt
        ? new Date(
            formData.endAt,
          )
        : null;

    if (
      Number.isNaN(
        startDate.getTime(),
      )
    ) {
      setErrorMessage(
        'A data inicial é inválida.',
      );

      return;
    }

    if (
      endDate &&
      Number.isNaN(
        endDate.getTime(),
      )
    ) {
      setErrorMessage(
        'A data final é inválida.',
      );

      return;
    }

    if (
      endDate &&
      endDate.getTime() <=
        startDate.getTime()
    ) {
      setErrorMessage(
        'O término precisa ser posterior ao início.',
      );

      return;
    }

    if (
      formData.scheduleMode ===
        'recorrente' &&
      !formData
        .recurrenceUntil
    ) {
      setErrorMessage(
        'Informe até quando o horário deverá se repetir.',
      );

      return;
    }

    if (
      formData.scheduleMode ===
        'recorrente' &&
      formData
        .recurrenceUntil <
        formData.startAt.slice(
          0,
          10,
        )
    ) {
      setErrorMessage(
        'A repetição não pode terminar antes do primeiro evento.',
      );

      return;
    }

    if (
      formData.saveAsTemplate &&
      formData
        .templateValidUntil &&
      formData
        .templateValidUntil <
        formData.startAt.slice(
          0,
          10,
        )
    ) {
      setErrorMessage(
        'A vigência do horário-padrão não pode terminar antes do primeiro evento.',
      );

      return;
    }

    setIsSaving(
      true,
    );

    try {
      const response =
        await fetch(
          '/api/agenda/events',
          {
            method:
              'POST',

            credentials:
              'include',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                title,

                description:
                  formData.description
                    .trim() ||
                  null,

                eventType:
                  formData.eventType,

                priority:
                  formData.priority,

                startAt:
                  startDate.toISOString(),

                endAt:
                  endDate
                    ? endDate.toISOString()
                    : null,

                status:
                  'planejado',

                scheduleMode:
                  formData
                    .scheduleMode,

                recurrenceFrequency:
                  formData
                    .scheduleMode ===
                  'recorrente'
                    ? 'weekly'
                    : 'none',

                recurrenceInterval:
                  formData
                    .scheduleMode ===
                  'recorrente'
                    ? Number(
                        formData
                          .recurrenceInterval,
                      )
                    : 1,

                recurrenceUntil:
                  formData
                    .scheduleMode ===
                  'recorrente'
                    ? formData
                        .recurrenceUntil
                    : null,
              }),
          },
        );

      const payload =
        await readJsonResponse<unknown>(
          response,
        );

      const commercialBlock =
        parseUpgradeAccessResponse(
          payload,
        );

      if (
        commercialBlock &&
        formData.scheduleMode ===
          'recorrente'
      ) {
        setRecurringUpgradeAccess(
          commercialBlock,
        );

        setShowForm(
          false,
        );

        setErrorMessage(
          '',
        );

        setWarningMessage(
          '',
        );

        setSuccessMessage(
          '',
        );

        return;
      }

      const result =
        normalizePayload<
          EventsApiResponse
        >(payload);

      if (
        !response.ok ||
        result.success !==
          true
      ) {
        throw new Error(
          getApiErrorMessage(
            payload,
            'Não foi possível salvar o evento.',
          ),
        );
      }

      let finalMessage =
        result.message ??
        'Evento salvo com sucesso.';

      if (
        formData.scheduleMode ===
          'pontual' &&
        formData
          .saveAsTemplate
      ) {
        try {
          const templateMessage =
            await saveScheduleTemplate();

          finalMessage =
            `${finalMessage} ${templateMessage}`;
        } catch (
          templateError
        ) {
          setWarningMessage(
            templateError instanceof Error
              ? `O evento foi salvo, mas o horário-padrão não foi criado: ${templateError.message}`
              : 'O evento foi salvo, mas o horário-padrão não foi criado.',
          );
        }
      }

      setSuccessMessage(
        finalMessage,
      );

      setShowForm(
        false,
      );

      const eventWeek =
        getWeekReference(
          startDate,
        );

      setSelectedWeek(
        eventWeek,
      );

      if (
        eventWeek ===
        selectedWeek
      ) {
        await loadEvents();
      }

      window.setTimeout(
        () => {
          eventsSectionRef
            .current
            ?.scrollIntoView({
              behavior:
                'smooth',

              block:
                'start',
            });
        },
        100,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o evento.',
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  async function handleDeleteEvent(
    agendaEvent:
      AgendaEvent,
  ): Promise<void> {
    clearMessages();

    const reason =
      window.prompt(
        `Informe o motivo da exclusão de "${agendaEvent.title}".`,
      );

    if (
      reason === null
    ) {
      return;
    }

    const normalizedReason =
      reason.trim();

    if (
      !normalizedReason
    ) {
      setErrorMessage(
        'O motivo da exclusão é obrigatório.',
      );

      return;
    }

    if (
      normalizedReason.length >
      MAX_DELETION_REASON_LENGTH
    ) {
      setErrorMessage(
        `O motivo da exclusão não pode ultrapassar ${MAX_DELETION_REASON_LENGTH} caracteres.`,
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Confirmar a exclusão de "${agendaEvent.title}"?\n\nO evento sairá da agenda, mas permanecerá preservado no histórico institucional.`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingEventId(
      agendaEvent.id,
    );

    try {
      const response =
        await fetch(
          `/api/agenda/events/${encodeURIComponent(
            agendaEvent.id,
          )}`,
          {
            method:
              'DELETE',

            credentials:
              'include',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                reason:
                  normalizedReason,
              }),
          },
        );

      const payload =
        await readJsonResponse<unknown>(
          response,
        );

      const result =
        normalizePayload<
          BasicApiResponse
        >(payload);

      if (
        !response.ok ||
        result.success !==
          true
      ) {
        throw new Error(
          getApiErrorMessage(
            payload,
            'Não foi possível excluir o evento.',
          ),
        );
      }

      setEvents(
        currentEvents =>
          currentEvents.filter(
            currentEvent =>
              currentEvent.id !==
              agendaEvent.id,
          ),
      );

      setSuccessMessage(
        result.message ??
          'Evento excluído com sucesso.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o evento.',
      );
    } finally {
      setDeletingEventId(
        null,
      );
    }
  }

  function handleQuickAction(
    action:
      QuickAction,
  ): void {
    if (
      action.action ===
        'form' &&
      action.mode
    ) {
      openEventForm(
        action.mode,
      );

      return;
    }

    selectNextWeek();

    window.setTimeout(
      () => {
        eventsSectionRef
          .current
          ?.scrollIntoView({
            behavior:
              'smooth',

            block:
              'start',
          });
      },
      100,
    );
  }

  return (
    <AgendaPageShell
      eyebrow="Organização temporal"
      title="Calendário pedagógico"
      description="Organize semanas, eventos pontuais, compromissos recorrentes e horários-padrão em um fluxo temporal integrado à Agenda Inteligente EDI."
    >
      <div className="space-y-6 sm:space-y-8">
        <section
          aria-label="Resumo da semana"
          className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4"
        >
          <SummaryCard
            label="Eventos"
            value={
              summary.total
            }
            description="Registros na semana"
            className="border-b border-slate-200 sm:border-r xl:border-b-0"
          />

          <SummaryCard
            label="Recorrentes"
            value={
              summary.recurring
            }
            description="Compromissos semanais"
            className="border-b border-slate-200 xl:border-b-0 xl:border-r"
          />

          <SummaryCard
            label="Horários-padrão"
            value={
              summary.fromTemplates
            }
            description="Aplicados por modelo"
            className="border-b border-slate-200 sm:border-r sm:border-b-0"
          />

          <SummaryCard
            label="Alta prioridade"
            value={
              summary.highPriority
            }
            description="Itens que exigem atenção"
          />
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
          <header className="border-b border-white/10 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Semana em planejamento
                </p>

                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                  {formatWeekLabel(
                    selectedWeek,
                  )}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Selecione o período que será carregado e organizado.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={
                    selectCurrentWeek
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10"
                >
                  Semana atual
                </button>

                <button
                  type="button"
                  onClick={
                    selectNextWeek
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#071827] transition hover:bg-cyan-200"
                >
                  Próxima semana
                </button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-[52px_minmax(0,1fr)_52px] gap-3 p-5 sm:p-7">
            <button
              type="button"
              onClick={() =>
                moveWeek(-1)
              }
              aria-label="Semana anterior"
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-white/20 bg-white/5 text-xl font-bold text-white transition hover:bg-white/10"
            >
              ←
            </button>

            <input
              type="date"
              value={
                selectedWeek
              }
              onChange={
                event => {
                  if (
                    !event.target
                      .value
                  ) {
                    return;
                  }

                  selectWeek(
                    getWeekReference(
                      parseDateInput(
                        event.target
                          .value,
                      ),
                    ),
                  );
                }
              }
              aria-label="Selecionar semana"
              className="min-h-[52px] w-full rounded-xl border border-white/20 bg-white px-4 font-semibold text-[#071827] outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/20"
            />

            <button
              type="button"
              onClick={() =>
                moveWeek(1)
              }
              aria-label="Próxima semana"
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-white/20 bg-white/5 text-xl font-bold text-white transition hover:bg-white/10"
            >
              →
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {quickActions.map(
            action => (
              <button
                key={
                  action.code
                }
                type="button"
                onClick={() =>
                  handleQuickAction(
                    action,
                  )
                }
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-cyan-300 hover:shadow-md"
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs font-bold text-[#0B7491]">
                      {
                        action.code
                      }
                    </span>

                    <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#075F78]">
                      {
                        action.label
                      }
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-bold text-[#071827]">
                    {
                      action.title
                    }
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {
                      action.description
                    }
                  </p>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#075F78]">
                    Executar ação

                    <span
                      aria-hidden="true"
                      className="transition group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </div>
              </button>
            ),
          )}
        </section>

        <ScheduleTemplatesPanel
          selectedWeek={
            selectedWeek
          }
          refreshKey={
            templatesRefreshKey
          }
          onApplied={
            loadEvents
          }
        />

        {successMessage ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800"
          >
            {
              successMessage
            }
          </div>
        ) : null}

        {warningMessage ? (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800"
          >
            {
              warningMessage
            }
          </div>
        ) : null}

        {errorMessage &&
        !showForm ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
          >
            {
              errorMessage
            }
          </div>
        ) : null}

        <section
          ref={
            eventsSectionRef
          }
          className="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
        >
          <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Agenda da semana
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                  Compromissos registrados
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {events.length}{' '}
                  evento
                  {events.length ===
                  1
                    ? ''
                    : 's'}{' '}
                  no período selecionado
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadEvents()
                }
                disabled={
                  isLoading
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? 'Atualizando...'
                  : 'Atualizar agenda'}
              </button>
            </div>
          </header>

          <div className="p-5 sm:p-7">
            {isLoading ? (
              <div
                role="status"
                className="rounded-xl border border-cyan-200 bg-cyan-50 p-6 text-center text-sm font-semibold text-cyan-900"
              >
                Carregando a semana...
              </div>
            ) : events.length ===
              0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-bold text-[#071827]">
                  Semana ainda sem eventos
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Adicione uma ação pontual, um evento recorrente ou aplique um horário-padrão.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    openEventForm(
                      'pontual',
                    )
                  }
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E]"
                >
                  Adicionar primeiro evento
                </button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {events.map(
                  (
                    agendaEvent,
                    index,
                  ) => (
                    <article
                      key={
                        agendaEvent.id
                      }
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="font-mono text-xs font-bold text-[#0B7491]">
                              {String(
                                index +
                                  1,
                              ).padStart(
                                2,
                                '0',
                              )}
                            </span>

                            <div className="min-w-0">
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#075F78]">
                                  {getEventTypeLabel(
                                    agendaEvent
                                      .event_type,
                                  )}
                                </span>

                                <span
                                  className={`rounded-lg border px-3 py-1 text-xs font-bold ${getScheduleModeClasses(
                                    agendaEvent,
                                  )}`}
                                >
                                  {getScheduleModeLabel(
                                    agendaEvent,
                                  )}
                                </span>
                              </div>

                              <h3 className="mt-3 break-words text-xl font-bold leading-7 text-[#071827]">
                                {
                                  agendaEvent.title
                                }
                              </h3>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold ${getPriorityClasses(
                              agendaEvent.priority,
                            )}`}
                          >
                            {getPriorityLabel(
                              agendaEvent.priority,
                            )}
                          </span>
                        </div>
                      </header>

                      <div className="space-y-4 p-5">
                        {agendaEvent.description ? (
                          <p className="break-words text-sm leading-6 text-slate-600">
                            {
                              agendaEvent.description
                            }
                          </p>
                        ) : (
                          <p className="text-sm italic text-slate-400">
                            Sem descrição complementar.
                          </p>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              Início
                            </p>

                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                              {formatEventDateTime(
                                agendaEvent.start_at,
                              )}
                            </p>
                          </section>

                          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              Término
                            </p>

                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                              {agendaEvent.end_at
                                ? formatEventDateTime(
                                    agendaEvent.end_at,
                                  )
                                : 'Não informado'}
                            </p>
                          </section>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                            Status:{' '}
                            {formatLabel(
                              agendaEvent.status,
                            )}
                          </span>

                          {agendaEvent.schedule_mode ===
                          'recorrente' ? (
                            <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
                              Intervalo:{' '}
                              {
                                agendaEvent.recurrence_interval
                              }{' '}
                              semana
                              {agendaEvent.recurrence_interval ===
                              1
                                ? ''
                                : 's'}
                            </span>
                          ) : null}
                        </div>

                        <footer className="border-t border-slate-200 pt-4">
                          <button
                            type="button"
                            disabled={
                              deletingEventId ===
                              agendaEvent.id
                            }
                            onClick={() =>
                              void handleDeleteEvent(
                                agendaEvent,
                              )
                            }
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 sm:w-auto"
                          >
                            {deletingEventId ===
                            agendaEvent.id
                              ? 'Excluindo...'
                              : 'Excluir evento'}
                          </button>
                        </footer>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        {recurringUpgradeAccess ? (
          <UpgradePrompt
            featureCode={
              recurringUpgradeAccess
                .featureCode
            }
            featureName={
              recurringUpgradeAccess
                .featureName ??
              'Eventos recorrentes'
            }
            currentPlanName={
              recurringUpgradeAccess
                .currentPlanName
            }
            requestedPlanCode="edi_professor_pro"
            requestedPlanName="EDI Professor Pro"
            sourceProduct="agenda_edi"
            sourceModule="calendario"
            sourcePath="/agenda/calendario"
            returnHref="/agenda/calendario"
          />
        ) : showForm ? (
          <section
            ref={
              formSectionRef
            }
            className="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
          >
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071827] font-mono text-xs font-bold text-cyan-300">
                    02
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                      {formData.scheduleMode ===
                      'recorrente'
                        ? 'Evento recorrente'
                        : 'Evento pontual'}
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                      {formData.scheduleMode ===
                      'recorrente'
                        ? 'Repetir horário'
                        : 'Criar evento'}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Defina a ação, o período e a forma de agendamento.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(
                      false,
                    );

                    clearMessages();
                  }}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]"
                >
                  Fechar
                </button>
              </div>
            </header>

            <form
              onSubmit={
                handleCreateEvent
              }
            >
              <div className="space-y-8 p-5 sm:p-7">
                <fieldset>
                  <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    01 — Identificação
                  </legend>

                  <div className="mt-5 space-y-5">
                    <div>
                      <label
                        htmlFor="event-title"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Título
                      </label>

                      <input
                        id="event-title"
                        type="text"
                        required
                        value={
                          formData.title
                        }
                        onChange={
                          event =>
                            updateFormField(
                              'title',
                              event.target
                                .value,
                            )
                        }
                        placeholder="Ex.: Planejamento semanal"
                        className={
                          inputClassName
                        }
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="event-description"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Descrição
                      </label>

                      <textarea
                        id="event-description"
                        rows={4}
                        value={
                          formData.description
                        }
                        onChange={
                          event =>
                            updateFormField(
                              'description',
                              event.target
                                .value,
                            )
                        }
                        placeholder="Descreva a ação pedagógica."
                        className={`${inputClassName} resize-y`}
                      />
                    </div>
                  </div>
                </fieldset>

                <div className="h-px bg-slate-200" />

                <fieldset>
                  <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    02 — Classificação
                  </legend>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="event-type"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Tipo de evento
                      </label>

                      <select
                        id="event-type"
                        value={
                          formData.eventType
                        }
                        onChange={
                          event =>
                            updateFormField(
                              'eventType',
                              event.target
                                .value,
                            )
                        }
                        className={
                          inputClassName
                        }
                      >
                        <option value="pedagogico">
                          Pedagógico
                        </option>

                        <option value="aula">
                          Aula
                        </option>

                        <option value="reuniao">
                          Reunião
                        </option>

                        <option value="formacao">
                          Formação
                        </option>

                        <option value="avaliacao">
                          Avaliação
                        </option>

                        <option value="prazo">
                          Prazo
                        </option>

                        <option value="acompanhamento">
                          Acompanhamento
                        </option>

                        <option value="outro">
                          Outro
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="event-priority"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Prioridade
                      </label>

                      <select
                        id="event-priority"
                        value={
                          formData.priority
                        }
                        onChange={
                          event =>
                            updateFormField(
                              'priority',
                              event.target
                                .value,
                            )
                        }
                        className={
                          inputClassName
                        }
                      >
                        <option value="baixa">
                          Baixa
                        </option>

                        <option value="media">
                          Média
                        </option>

                        <option value="alta">
                          Alta
                        </option>

                        <option value="urgente">
                          Urgente
                        </option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                <div className="h-px bg-slate-200" />

                <fieldset>
                  <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    03 — Período
                  </legend>

                  <div className="mt-5 space-y-5">
                    <div>
                      <label
                        htmlFor="time-preset"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Horário pré-programado
                      </label>

                      <select
                        id="time-preset"
                        value={
                          selectedPreset
                        }
                        onChange={
                          event =>
                            applyTimePreset(
                              event.target
                                .value,
                            )
                        }
                        className={
                          inputClassName
                        }
                      >
                        {timePresets.map(
                          preset => (
                            <option
                              key={
                                preset.value
                              }
                              value={
                                preset.value
                              }
                            >
                              {
                                preset.label
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="event-start"
                          className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                          Início
                        </label>

                        <input
                          id="event-start"
                          type="datetime-local"
                          required
                          value={
                            formData.startAt
                          }
                          onChange={
                            event => {
                              updateFormField(
                                'startAt',
                                event.target
                                  .value,
                              );

                              setSelectedPreset(
                                'custom',
                              );
                            }
                          }
                          className={
                            inputClassName
                          }
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="event-end"
                          className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                          Término
                        </label>

                        <input
                          id="event-end"
                          type="datetime-local"
                          value={
                            formData.endAt
                          }
                          min={
                            formData.startAt ||
                            undefined
                          }
                          onChange={
                            event => {
                              updateFormField(
                                'endAt',
                                event.target
                                  .value,
                              );

                              setSelectedPreset(
                                'custom',
                              );
                            }
                          }
                          className={
                            inputClassName
                          }
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <div className="h-px bg-slate-200" />

                <fieldset>
                  <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    04 — Forma de agendamento
                  </legend>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <label
                      className={`cursor-pointer rounded-xl border p-5 transition ${
                        formData.scheduleMode ===
                        'pontual'
                          ? 'border-[#0B7491] bg-cyan-50'
                          : 'border-slate-200 bg-white hover:border-cyan-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="schedule-mode"
                        value="pontual"
                        checked={
                          formData.scheduleMode ===
                          'pontual'
                        }
                        onChange={() => {
                          setFormData(
                            current => ({
                              ...current,

                              scheduleMode:
                                'pontual',
                            }),
                          );

                          clearMessages();
                        }}
                        className="sr-only"
                      />

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-[#071827]">
                            Apenas uma vez
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            O compromisso ocorrerá somente na data selecionada.
                          </p>
                        </div>

                        <span
                          aria-hidden="true"
                          className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                            formData.scheduleMode ===
                            'pontual'
                              ? 'bg-[#0B7491]'
                              : 'border border-slate-300 bg-white'
                          }`}
                        />
                      </div>
                    </label>

                    <label
                      className={`cursor-pointer rounded-xl border p-5 transition ${
                        formData.scheduleMode ===
                        'recorrente'
                          ? 'border-[#0B7491] bg-cyan-50'
                          : 'border-slate-200 bg-white hover:border-cyan-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="schedule-mode"
                        value="recorrente"
                        checked={
                          formData.scheduleMode ===
                          'recorrente'
                        }
                        onChange={() => {
                          setFormData(
                            current => ({
                              ...current,

                              scheduleMode:
                                'recorrente',

                              saveAsTemplate:
                                false,
                            }),
                          );

                          clearMessages();
                        }}
                        className="sr-only"
                      />

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-[#071827]">
                            Repetir automaticamente
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Gera eventos no mesmo dia e horário nas semanas seguintes.
                          </p>
                        </div>

                        <span
                          aria-hidden="true"
                          className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                            formData.scheduleMode ===
                            'recorrente'
                              ? 'bg-[#0B7491]'
                              : 'border border-slate-300 bg-white'
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                </fieldset>

                {formData.scheduleMode ===
                'recorrente' ? (
                  <section className="grid gap-5 rounded-xl border border-cyan-200 bg-cyan-50 p-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="recurrence-interval"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Frequência
                      </label>

                      <select
                        id="recurrence-interval"
                        value={
                          formData.recurrenceInterval
                        }
                        onChange={
                          event =>
                            updateFormField(
                              'recurrenceInterval',
                              event.target
                                .value,
                            )
                        }
                        className={
                          inputClassName
                        }
                      >
                        <option value="1">
                          Toda semana
                        </option>

                        <option value="2">
                          A cada duas semanas
                        </option>

                        <option value="3">
                          A cada três semanas
                        </option>

                        <option value="4">
                          A cada quatro semanas
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="recurrence-until"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Repetir até
                      </label>

                      <input
                        id="recurrence-until"
                        type="date"
                        required
                        min={
                          formData.startAt.slice(
                            0,
                            10,
                          ) ||
                          undefined
                        }
                        value={
                          formData.recurrenceUntil
                        }
                        onChange={
                          event =>
                            updateFormField(
                              'recurrenceUntil',
                              event.target
                                .value,
                            )
                        }
                        className={
                          inputClassName
                        }
                      />
                    </div>
                  </section>
                ) : (
                  <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                    <label className="flex cursor-pointer items-start gap-4">
                      <input
                        type="checkbox"
                        checked={
                          formData.saveAsTemplate
                        }
                        onChange={
                          event => {
                            setFormData(
                              current => ({
                                ...current,

                                saveAsTemplate:
                                  event.target
                                    .checked,
                              }),
                            );

                            clearMessages();
                          }
                        }
                        className="mt-1 h-5 w-5 shrink-0 accent-[#0B7491]"
                      />

                      <span>
                        <span className="block font-bold text-[#071827]">
                          Salvar também como horário-padrão
                        </span>

                        <span className="mt-2 block text-sm leading-6 text-slate-600">
                          Este horário ficará disponível para ser aplicado manualmente às próximas semanas.
                        </span>
                      </span>
                    </label>

                    {formData.saveAsTemplate ? (
                      <div className="mt-5">
                        <label
                          htmlFor="template-valid-until"
                          className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                          Manter o horário disponível até
                        </label>

                        <input
                          id="template-valid-until"
                          type="date"
                          min={
                            formData.startAt.slice(
                              0,
                              10,
                            ) ||
                            undefined
                          }
                          value={
                            formData.templateValidUntil
                          }
                          onChange={
                            event =>
                              updateFormField(
                                'templateValidUntil',
                                event.target
                                  .value,
                              )
                          }
                          className={
                            inputClassName
                          }
                        />
                      </div>
                    ) : null}
                  </section>
                )}

                {errorMessage ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
                  >
                    {
                      errorMessage
                    }
                  </div>
                ) : null}
              </div>

              <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:px-7">
                <button
                  type="button"
                  disabled={
                    isSaving
                  }
                  onClick={() => {
                    setFormData(
                      createInitialForm(
                        selectedWeek,
                        formData.scheduleMode,
                      ),
                    );

                    setSelectedPreset(
                      '14:20|15:10',
                    );

                    clearMessages();
                  }}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Limpar campos
                </button>

                <button
                  type="submit"
                  disabled={
                    isSaving
                  }
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSaving
                    ? 'Salvando...'
                    : formData.scheduleMode ===
                        'recorrente'
                      ? 'Salvar eventos recorrentes'
                      : formData.saveAsTemplate
                        ? 'Salvar evento e horário-padrão'
                        : 'Salvar evento pontual'}
                </button>
              </footer>
            </form>
          </section>
        ) : null}

        <section className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-3">
          <article>
            <p className="font-mono text-xs font-bold text-[#0B7491]">
              01
            </p>

            <h3 className="mt-3 font-bold text-[#071827]">
              Planejamento semanal
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Organize eventos no período em que serão executados.
            </p>
          </article>

          <article>
            <p className="font-mono text-xs font-bold text-[#0B7491]">
              02
            </p>

            <h3 className="mt-3 font-bold text-[#071827]">
              Rotinas reutilizáveis
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Utilize horários-padrão para reduzir registros repetitivos.
            </p>
          </article>

          <article>
            <p className="font-mono text-xs font-bold text-[#0B7491]">
              03
            </p>

            <h3 className="mt-3 font-bold text-[#071827]">
              Preservação histórica
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Eventos excluídos permanecem registrados para auditoria e restauração.
            </p>
          </article>
        </section>
      </div>
    </AgendaPageShell>
  );
}