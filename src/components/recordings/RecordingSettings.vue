<template>
  <div>
    <div class="text-subtitle2">{{ $t("recordings.settings.title") }}</div>
    <q-separator />
    <div class="text-caption text-grey q-mt-sm">
      {{ $t("recordings.settings.description") }}
    </div>
    <q-banner
      v-if="loaded && !settings.boto3_installed"
      dense
      class="bg-warning text-black q-mt-md"
    >
      <template #avatar><q-icon name="warning" /></template>
      {{ $t("recordings.settings.boto3Missing") }}
    </q-banner>
    <q-banner
      v-if="loaded && settings.enabled && settings.record_mesh"
      dense
      class="bg-info text-white q-mt-md"
    >
      <template #avatar><q-icon name="info" /></template>
      {{ $t("recordings.settings.meshSetup") }}
      <code>python manage.py recordings_setup_mesh</code>
    </q-banner>

    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("recordings.settings.enabled") }}</div>
      <div class="col-2"></div>
      <q-toggle v-model="settings.enabled" class="col-4" />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">
        {{ $t("recordings.settings.recordMesh") }}
        <div class="text-caption text-grey">
          {{ $t("recordings.settings.recordMeshHint") }}
        </div>
      </div>
      <div class="col-2"></div>
      <q-toggle v-model="settings.record_mesh" class="col-4" />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">
        {{ $t("recordings.settings.recordRustdesk") }}
        <div class="text-caption text-grey">
          {{ $t("recordings.settings.recordRustdeskHint") }}
        </div>
      </div>
      <div class="col-2"></div>
      <q-toggle v-model="settings.record_rustdesk" class="col-4" />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">
        {{ $t("recordings.settings.recordQs") }}
        <div class="text-caption text-grey">
          {{ $t("recordings.settings.recordQsHint") }}
        </div>
      </div>
      <div class="col-2"></div>
      <q-toggle v-model="settings.record_qs" class="col-4" />
    </q-card-section>

    <div class="text-subtitle2 q-mt-md">
      {{ $t("recordings.settings.storage") }}
    </div>
    <q-separator />
    <q-card-section class="row items-center">
      <div class="col-6">
        {{ $t("recordings.settings.endpoint") }}
        <div class="text-caption text-grey">
          {{ $t("recordings.settings.endpointHint") }}
        </div>
      </div>
      <div class="col-2"></div>
      <q-input
        v-model="settings.s3_endpoint"
        outlined
        dense
        class="col-4"
        placeholder="s3.amazonaws.com"
      />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("recordings.settings.region") }}</div>
      <div class="col-2"></div>
      <q-input
        v-model="settings.s3_region"
        outlined
        dense
        class="col-4"
        placeholder="sa-east-1"
      />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("recordings.settings.bucket") }}</div>
      <div class="col-2"></div>
      <q-input v-model="settings.s3_bucket" outlined dense class="col-4" />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("recordings.settings.prefix") }}</div>
      <div class="col-2"></div>
      <q-input v-model="settings.s3_prefix" outlined dense class="col-4" />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("recordings.settings.accessKey") }}</div>
      <div class="col-2"></div>
      <q-input
        v-model="settings.s3_access_key"
        outlined
        dense
        class="col-4"
        autocomplete="off"
      />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("recordings.settings.secretKey") }}</div>
      <div class="col-2"></div>
      <q-input
        v-model="secret"
        outlined
        dense
        type="password"
        class="col-4"
        autocomplete="new-password"
        :placeholder="
          settings.s3_secret_set ? $t('recordings.settings.secretKept') : ''
        "
      />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">
        {{ $t("recordings.settings.pathStyle") }}
        <div class="text-caption text-grey">
          {{ $t("recordings.settings.pathStyleHint") }}
        </div>
      </div>
      <div class="col-2"></div>
      <q-toggle v-model="settings.s3_path_style" class="col-4" />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("recordings.settings.sse") }}</div>
      <div class="col-2"></div>
      <q-toggle v-model="settings.s3_sse" class="col-4" />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("recordings.settings.presignMinutes") }}</div>
      <div class="col-2"></div>
      <q-input
        v-model.number="settings.presign_minutes"
        type="number"
        outlined
        dense
        class="col-4"
        :rules="[(v) => (v >= 1 && v <= 1440) || '1 - 1440']"
      />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("recordings.settings.maxFileMb") }}</div>
      <div class="col-2"></div>
      <q-input
        v-model.number="settings.max_file_mb"
        type="number"
        outlined
        dense
        class="col-4"
      />
    </q-card-section>
    <div class="text-caption text-grey q-px-md">
      {{ $t("recordings.settings.retentionHint") }}
    </div>
    <q-card-section class="row q-gutter-sm items-center">
      <q-btn
        color="primary"
        :label="$t('common.save')"
        :loading="saving"
        @click="save"
      />
      <q-btn
        flat
        color="primary"
        icon="cloud_done"
        :label="$t('recordings.settings.test')"
        :loading="testing"
        @click="test"
      />
      <span v-if="settings.pending" class="text-caption text-grey">
        {{ $t("recordings.settings.pending", { count: settings.pending }) }}
      </span>
    </q-card-section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import {
  fetchRecordingSettings,
  saveRecordingSettings,
  testRecordingStorage,
  type RecordingSettings,
} from "@/api/recordings";
import { notifySuccess } from "@/utils/notify";

const $q = useQuasar();
const { t } = useI18n();

const loaded = ref(false);
const saving = ref(false);
const testing = ref(false);
const secret = ref("");
const settings = ref<RecordingSettings>({
  enabled: false,
  record_mesh: true,
  record_rustdesk: true,
  record_qs: true,
  s3_endpoint: "",
  s3_region: "",
  s3_bucket: "",
  s3_prefix: "recordings",
  s3_access_key: "",
  s3_path_style: false,
  s3_sse: true,
  presign_minutes: 15,
  max_file_mb: 4096,
});

async function load() {
  settings.value = await fetchRecordingSettings();
  loaded.value = true;
}

// only the editable fields (the GET also returns status values)
const EDITABLE: (keyof RecordingSettings)[] = [
  "enabled",
  "record_mesh",
  "record_rustdesk",
  "record_qs",
  "s3_endpoint",
  "s3_region",
  "s3_bucket",
  "s3_prefix",
  "s3_access_key",
  "s3_path_style",
  "s3_sse",
  "presign_minutes",
  "max_file_mb",
];

function payload(): Partial<RecordingSettings> {
  const data: Record<string, unknown> = {};
  for (const key of EDITABLE) data[key] = settings.value[key];
  if (secret.value) data.s3_secret = secret.value;
  return data as Partial<RecordingSettings>;
}

async function save() {
  saving.value = true;
  try {
    await saveRecordingSettings(payload());
    secret.value = "";
    notifySuccess(t("recordings.settings.saved"));
    await load();
  } finally {
    saving.value = false;
  }
}

async function test() {
  testing.value = true;
  try {
    await saveRecordingSettings(payload());
    secret.value = "";
    const result = await testRecordingStorage();
    // plain text: the CORS result can carry an error message of the bucket
    $q.dialog({
      title: t("recordings.settings.test"),
      message: `${t("recordings.settings.testWrite")}: ${result.write} | ${t(
        "recordings.settings.testCors",
      )}: ${result.cors}`,
    });
    await load();
  } finally {
    testing.value = false;
  }
}

onMounted(load);
</script>
