<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 90vw; max-width: 1100px">
      <q-bar>
        <q-icon name="support_agent" class="q-mr-sm" />
        {{ $t("quickSupport.title") }}
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-white text-primary">{{
            $t("common.close")
          }}</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="text-body2 text-grey q-mb-md">
          {{ $t("quickSupport.description") }}
        </div>
        <q-form class="row q-col-gutter-md items-center" @submit="connect">
          <div class="col-12 col-sm-5">
            <q-input
              v-model="code"
              outlined
              autofocus
              :label="$t('quickSupport.code')"
              mask="### ### ###"
              unmasked-value
              input-class="text-h6 text-weight-bold"
              :hint="$t('quickSupport.codeHint')"
            >
              <template #prepend><q-icon name="pin" /></template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn
              type="submit"
              color="primary"
              icon="cast_connected"
              :label="$t('common.connect')"
              :disable="code.length !== 9"
            />
          </div>
          <q-space />
          <div class="col-auto">
            <q-btn
              flat
              color="primary"
              icon="download"
              :label="$t('quickSupport.downloadClient')"
              :loading="downloading"
              @click="download"
            >
              <q-tooltip style="max-width: 320px">{{
                $t("quickSupport.downloadClientTooltip")
              }}</q-tooltip>
            </q-btn>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-banner
        v-if="pendingInstalls > 0"
        dense
        class="bg-warning text-black"
      >
        <template #avatar><q-icon name="install_desktop" /></template>
        {{ $t("quickSupport.install.pending", { count: pendingInstalls }) }}
      </q-banner>

      <q-card-section class="q-pa-none">
        <q-table
          dense
          flat
          :title="$t('quickSupport.activeSessions')"
          :rows="sessions"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :pagination="{ rowsPerPage: 0, sortBy: 'created', descending: true }"
          hide-pagination
          :no-data-label="$t('quickSupport.noSessions')"
        >
          <template #top-right>
            <q-btn
              dense
              flat
              icon="refresh"
              :label="$t('common.refresh')"
              @click="getSessions"
            />
          </template>
          <template #body-cell-formatted_code="props">
            <q-td :props="props">
              <span v-if="props.row.kind === 'rustdesk'">
                <q-badge
                  color="primary"
                  :label="$t('quickSupport.install.kindDesktop')"
                />
                <span class="q-ml-xs text-caption">ID {{ props.row.remote_id }}</span>
              </span>
              <span v-else class="text-weight-bold text-primary">{{
                props.value
              }}</span>
            </q-td>
          </template>
          <template #body-cell-install="props">
            <q-td :props="props">
              <template v-if="props.row.install_status">
                <q-badge
                  :color="installColor(props.row.install_status)"
                  :label="$t(`quickSupport.install.${props.row.install_status}`)"
                />
                <span
                  v-if="props.row.install_site_name"
                  class="q-ml-xs text-caption"
                  >{{ props.row.install_site_name }}</span
                >
                <q-tooltip v-if="props.row.install_message">{{
                  props.row.install_message
                }}</q-tooltip>
              </template>
              <template v-if="props.row.install_status === 'requested'">
                <q-btn
                  dense
                  unelevated
                  size="sm"
                  color="positive"
                  class="q-ml-sm"
                  :label="$t('quickSupport.install.approve')"
                  @click="openApprove(props.row)"
                />
                <q-btn
                  dense
                  flat
                  size="sm"
                  color="negative"
                  :label="$t('quickSupport.install.deny')"
                  @click="deny(props.row)"
                />
              </template>
              <q-btn
                v-else-if="!['approved', 'sent', 'done'].includes(props.row.install_status)"
                dense
                flat
                size="sm"
                color="primary"
                icon="install_desktop"
                :label="$t('quickSupport.install.start')"
                @click="openApprove(props.row)"
              />
            </q-td>
          </template>
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.status === 'connected' ? 'positive' : 'info'"
                :label="$t(`quickSupport.status.${props.row.status}`)"
              />
              <span v-if="props.row.connected_by" class="q-ml-xs text-caption">
                ({{ props.row.connected_by }})
              </span>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                v-if="props.row.kind !== 'rustdesk'"
                dense
                flat
                color="primary"
                icon="cast_connected"
                @click="openControl(props.row.code)"
              >
                <q-tooltip>{{ $t("common.connect") }}</q-tooltip>
              </q-btn>
              <q-btn
                dense
                flat
                color="negative"
                icon="stop_circle"
                @click="endSession(props.row)"
              >
                <q-tooltip>{{ $t("quickSupport.endSession") }}</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="approveOpen">
      <q-card style="width: 480px; max-width: 90vw">
        <q-card-section class="text-h6">{{
          $t("quickSupport.install.dialogTitle", {
            hostname: approveSession?.hostname,
          })
        }}</q-card-section>
        <q-card-section class="q-gutter-md">
          <div class="text-body2">
            {{
              approveSession?.kind === "rustdesk"
                ? $t("quickSupport.install.agentAndRemote")
                : $t("quickSupport.install.agentOnly")
            }}
          </div>
          <!-- name and user come from the customer's program; the IP from the server -->
          <div class="text-caption text-grey">
            {{ $t("quickSupport.install.reported") }}:
            {{ approveSession?.hostname }} &bull; {{ approveSession?.username }}<br />
            IP: {{ approveSession?.client_ip || "-" }}
          </div>
          <q-select
            v-model="approveClient"
            outlined
            dense
            emit-value
            map-options
            :options="clientOptions"
            :label="$t('quickSupport.install.client')"
            @update:model-value="approveSite = siteOptions[0]?.value ?? null"
          />
          <q-select
            v-model="approveSite"
            outlined
            dense
            emit-value
            map-options
            :options="siteOptions"
            :label="$t('quickSupport.install.site')"
          />
          <q-select
            v-model="approveType"
            outlined
            dense
            emit-value
            map-options
            :options="[
              {
                label: $t('quickSupport.install.workstation'),
                value: 'workstation',
              },
              { label: $t('quickSupport.install.server'), value: 'server' },
            ]"
            :label="$t('quickSupport.install.agentType')"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('common.cancel')" />
          <q-btn
            color="positive"
            :label="$t('quickSupport.install.approve')"
            :disable="!approveSite"
            :loading="approving"
            @click="approve"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import {
  fetchQuickSupportSessions,
  endQuickSupportSession,
  downloadQuickSupportClient,
  openQuickSupportControl,
  approveQuickSupportInstall,
  denyQuickSupportInstall,
  type QuickSupportSession,
} from "@/api/quicksupport";
import { fetchClients } from "@/api/clients";
import { notifySuccess } from "@/utils/notify";
import { formatDate } from "@/utils/format";

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();
const { t } = useI18n();

const code = ref("");
const sessions = ref<QuickSupportSession[]>([]);
const loading = ref(false);
const downloading = ref(false);

const columns = computed(() => [
  {
    name: "formatted_code",
    label: t("quickSupport.code"),
    field: "formatted_code",
    align: "left" as const,
  },
  {
    name: "hostname",
    label: t("common.hostname"),
    field: "hostname",
    align: "left" as const,
    sortable: true,
  },
  {
    name: "username",
    label: t("quickSupport.loggedUser"),
    field: "username",
    align: "left" as const,
  },
  {
    name: "os",
    label: t("quickSupport.os"),
    field: "os",
    align: "left" as const,
  },
  {
    name: "client_ip",
    label: t("quickSupport.ip"),
    field: "client_ip",
    align: "left" as const,
  },
  {
    name: "status",
    label: t("common.status"),
    field: "status",
    align: "left" as const,
  },
  {
    name: "install",
    label: t("quickSupport.install.column"),
    field: "install_status",
    align: "left" as const,
  },
  {
    name: "created",
    label: t("quickSupport.started"),
    field: "created",
    align: "left" as const,
    sortable: true,
    format: (val: string) => formatDate(val),
  },
  { name: "actions", label: "", field: "id", align: "right" as const },
]);

async function getSessions() {
  loading.value = true;
  try {
    sessions.value = await fetchQuickSupportSessions();
  } catch (e) {
    console.error(e);
  }
  loading.value = false;
}

function openControl(sessionCode: string) {
  openQuickSupportControl(sessionCode);
}

async function connect() {
  if (code.value.length !== 9) return;
  // the control window does the actual connection (and shows errors)
  openControl(code.value);
  code.value = "";
  setTimeout(getSessions, 3000);
}

function endSession(session: QuickSupportSession) {
  $q.dialog({
    title: t("quickSupport.endSession"),
    message: t("quickSupport.endSessionConfirm", {
      hostname: session.hostname,
      code: session.formatted_code,
    }),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await endQuickSupportSession(session.id);
      notifySuccess(t("quickSupport.sessionEnded"));
      getSessions();
    } catch (e) {
      console.error(e);
    }
  });
}

async function download() {
  downloading.value = true;
  try {
    await downloadQuickSupportClient();
  } catch (e) {
    console.error(e);
  }
  downloading.value = false;
}

// ---------------------------------------------------------- permanent access
interface ClientRow {
  id: number;
  name: string;
  sites: { id: number; name: string }[];
}

const pendingInstalls = computed(
  () => sessions.value.filter((s) => s.install_status === "requested").length,
);
const approveOpen = ref(false);
const approving = ref(false);
const approveSession = ref<QuickSupportSession | null>(null);
const clients = ref<ClientRow[]>([]);
const approveClient = ref<number | null>(null);
const approveSite = ref<number | null>(null);
const approveType = ref("workstation");

const clientOptions = computed(() =>
  clients.value.map((c) => ({ label: c.name, value: c.id })),
);
const siteOptions = computed(() =>
  (clients.value.find((c) => c.id === approveClient.value)?.sites ?? []).map(
    (s) => ({ label: s.name, value: s.id }),
  ),
);

function installColor(status: string) {
  if (status === "requested") return "warning";
  if (status === "done") return "positive";
  if (status === "failed" || status === "denied") return "negative";
  return "info";
}

async function openApprove(session: QuickSupportSession) {
  approveSession.value = session;
  if (clients.value.length === 0) {
    clients.value = (await fetchClients()) ?? [];
  }
  approveClient.value = clients.value[0]?.id ?? null;
  approveSite.value = siteOptions.value[0]?.value ?? null;
  approveType.value = "workstation";
  approveOpen.value = true;
}

async function approve() {
  if (!approveSession.value || !approveSite.value) return;
  approving.value = true;
  try {
    await approveQuickSupportInstall(
      approveSession.value.id,
      approveSite.value,
      approveType.value,
    );
    notifySuccess(t("quickSupport.install.approvedNotify"));
    approveOpen.value = false;
    getSessions();
  } catch (e) {
    console.error(e);
  }
  approving.value = false;
}

async function deny(session: QuickSupportSession) {
  try {
    await denyQuickSupportInstall(session.id);
    getSessions();
  } catch (e) {
    console.error(e);
  }
}

let poll: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  getSessions();
  poll = setInterval(getSessions, 5000);
});

onBeforeUnmount(() => {
  if (poll) clearInterval(poll);
});
</script>
