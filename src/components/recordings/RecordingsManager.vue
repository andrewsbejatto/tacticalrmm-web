<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 95vw; max-width: 1400px">
      <q-bar>
        <q-icon name="video_library" class="q-mr-sm" />
        {{ title }}
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-white text-primary">{{
            $t("common.close")
          }}</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="row q-col-gutter-sm items-center">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          debounce="400"
          class="col-12 col-sm-3"
          :label="$t('recordings.search')"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-select
          v-model="source"
          dense
          outlined
          emit-value
          map-options
          class="col-6 col-sm-2"
          :options="sourceOptions"
          :label="$t('recordings.source')"
        />
        <q-select
          v-model="status"
          dense
          outlined
          emit-value
          map-options
          class="col-6 col-sm-2"
          :options="statusOptions"
          :label="$t('common.status')"
        />
        <q-input
          v-model="dateFrom"
          dense
          outlined
          type="date"
          stack-label
          class="col-6 col-sm-2"
          :label="$t('recordings.from')"
        />
        <q-input
          v-model="dateTo"
          dense
          outlined
          type="date"
          stack-label
          class="col-6 col-sm-2"
          :label="$t('recordings.to')"
        />
        <div class="col-auto">
          <q-btn dense flat icon="refresh" @click="reload">
            <q-tooltip>{{ $t("common.refresh") }}</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-table
          v-model:pagination="pagination"
          dense
          flat
          :rows="rows"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :rows-per-page-options="[25, 50, 100]"
          :no-data-label="$t('recordings.noRecordings')"
          style="max-height: 70vh"
          @request="onRequest"
        >
          <template #body-cell-source="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.source === 'mesh' ? 'teal' : 'primary'"
                :label="$t(`recordings.sources.${props.row.source}`)"
              />
            </q-td>
          </template>
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="statusColor(props.row.status)"
                :label="$t(`recordings.statuses.${props.row.status}`)"
              />
              <q-tooltip v-if="props.row.last_error" style="max-width: 400px">{{
                props.row.last_error
              }}</q-tooltip>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                dense
                flat
                color="primary"
                icon="play_circle"
                :disable="props.row.status !== 'uploaded'"
                :loading="playing === props.row.id"
                @click="play(props.row)"
              >
                <q-tooltip>{{ $t("recordings.play") }}</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import {
  fetchRecordings,
  fetchRecordingPlayLink,
  type Recording,
  type RecordingSource,
  type RecordingStatus,
} from "@/api/recordings";
import { formatDate } from "@/utils/format";
import RecordingPlayer from "@/components/recordings/RecordingPlayer.vue";

const props = defineProps<{ agentId?: string; hostname?: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();
const { t } = useI18n();

const rows = ref<Recording[]>([]);
const loading = ref(false);
const playing = ref<number | null>(null);
const search = ref("");
const source = ref<RecordingSource | "">("");
const status = ref<RecordingStatus | "">("");
const dateFrom = ref("");
const dateTo = ref("");
const pagination = ref({
  page: 1,
  rowsPerPage: 50,
  rowsNumber: 0,
  sortBy: "started",
  descending: true,
});

const title = computed(() =>
  props.hostname
    ? `${t("recordings.title")} - ${props.hostname}`
    : t("recordings.title"),
);

const sourceOptions = computed(() => [
  { label: t("recordings.all"), value: "" },
  { label: t("recordings.sources.mesh"), value: "mesh" },
  { label: t("recordings.sources.rustdesk"), value: "rustdesk" },
  { label: t("recordings.sources.qs_rustdesk"), value: "qs_rustdesk" },
]);

const statusOptions = computed(() => [
  { label: t("recordings.all"), value: "" },
  ...(["uploaded", "pending", "receiving", "error"] as const).map((s) => ({
    label: t(`recordings.statuses.${s}`),
    value: s,
  })),
]);

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}

function statusColor(value: RecordingStatus): string {
  return (
    {
      uploaded: "positive",
      pending: "warning",
      receiving: "info",
      error: "negative",
    }[value] || "grey"
  );
}

const columns = computed(() => [
  {
    name: "started",
    label: t("recordings.started"),
    field: "started",
    align: "left" as const,
    format: (val: string) => formatDate(val),
  },
  {
    name: "duration",
    label: t("recordings.duration"),
    field: "duration",
    align: "left" as const,
    format: (val: number) => formatDuration(val),
  },
  {
    name: "hostname",
    label: t("common.hostname"),
    field: "hostname",
    align: "left" as const,
  },
  {
    name: "client",
    label: t("recordings.clientSite"),
    field: (row: Recording) =>
      row.client_name ? `${row.client_name} / ${row.site_name || "-"}` : "-",
    align: "left" as const,
  },
  {
    name: "technician",
    label: t("recordings.technician"),
    field: "technician_name",
    align: "left" as const,
  },
  {
    name: "source",
    label: t("recordings.source"),
    field: "source",
    align: "left" as const,
  },
  {
    name: "size",
    label: t("recordings.size"),
    field: "size",
    align: "right" as const,
    format: (val: number) => formatSize(val),
  },
  {
    name: "status",
    label: t("common.status"),
    field: "status",
    align: "left" as const,
  },
  { name: "actions", label: "", field: "id", align: "right" as const },
]);

function toIso(value: string, endOfDay: boolean): string | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

async function load() {
  loading.value = true;
  try {
    const data = await fetchRecordings({
      page: pagination.value.page,
      page_size: pagination.value.rowsPerPage,
      agent_id: props.agentId,
      source: source.value,
      status: status.value,
      search: search.value || undefined,
      from: toIso(dateFrom.value, false),
      to: toIso(dateTo.value, true),
    });
    rows.value = data.results;
    pagination.value.rowsNumber = data.total;
  } finally {
    loading.value = false;
  }
}

function onRequest(req: { pagination: { page: number; rowsPerPage: number } }) {
  pagination.value.page = req.pagination.page;
  pagination.value.rowsPerPage = req.pagination.rowsPerPage;
  load();
}

function reload() {
  pagination.value.page = 1;
  load();
}

async function play(row: Recording) {
  playing.value = row.id;
  try {
    const link = await fetchRecordingPlayLink(row.id);
    $q.dialog({
      component: RecordingPlayer,
      componentProps: {
        link,
        title: `${row.hostname} - ${formatDate(row.started)}`,
      },
    });
  } finally {
    playing.value = null;
  }
}

watch([search, source, status, dateFrom, dateTo], reload);
onMounted(load);
</script>
