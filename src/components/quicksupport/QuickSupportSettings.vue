<template>
  <div>
    <div class="text-subtitle2">{{ $t("quickSupport.title") }}</div>
    <q-separator />
    <div class="text-caption text-grey q-mt-sm">
      {{ $t("quickSupport.settings.description") }}
    </div>

    <q-banner
      v-if="loaded && !settings.client_available"
      dense
      class="bg-warning text-black q-mt-md"
    >
      <template #avatar><q-icon name="warning" /></template>
      {{ $t("quickSupport.settings.clientMissing") }}
    </q-banner>

    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("quickSupport.settings.enabled") }}</div>
      <div class="col-2"></div>
      <q-toggle v-model="settings.enabled" class="col-4" />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("quickSupport.settings.companyName") }}</div>
      <div class="col-2"></div>
      <q-input
        v-model="settings.company_name"
        outlined
        dense
        class="col-4"
        :hint="$t('quickSupport.settings.companyNameHint')"
      />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("quickSupport.settings.welcomeMessage") }}</div>
      <div class="col-2"></div>
      <q-input
        v-model="settings.welcome_message"
        outlined
        dense
        autogrow
        class="col-4"
      />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">
        {{ $t("quickSupport.settings.requireConsent") }}
        <div class="text-caption text-grey">
          {{ $t("quickSupport.settings.requireConsentHint") }}
        </div>
      </div>
      <div class="col-2"></div>
      <q-toggle v-model="settings.require_consent" class="col-4" />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">
        {{ $t("quickSupport.settings.showPrivacyBar") }}
        <div class="text-caption text-grey">
          {{ $t("quickSupport.settings.showPrivacyBarHint") }}
        </div>
      </div>
      <div class="col-2"></div>
      <q-toggle v-model="settings.show_privacy_bar" class="col-4" />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">
        {{ $t("quickSupport.settings.showNotification") }}
        <div class="text-caption text-grey">
          {{ $t("quickSupport.settings.showNotificationHint") }}
        </div>
      </div>
      <div class="col-2"></div>
      <q-toggle v-model="settings.show_notification" class="col-4" />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("quickSupport.settings.sessionTimeout") }}</div>
      <div class="col-2"></div>
      <q-input
        v-model.number="settings.session_timeout"
        type="number"
        outlined
        dense
        class="col-4"
        :rules="[(v) => (v >= 1 && v <= 60) || '1 - 60']"
      />
    </q-card-section>
    <q-card-section class="row items-center">
      <div class="col-6">{{ $t("quickSupport.settings.meshGroup") }}</div>
      <div class="col-2"></div>
      <q-input
        v-model="settings.mesh_group_name"
        outlined
        dense
        class="col-4"
      />
    </q-card-section>

    <q-card-section class="row q-gutter-sm">
      <q-btn
        color="primary"
        :label="$t('common.save')"
        :loading="saving"
        @click="save"
      />
      <q-btn
        flat
        color="primary"
        icon="download"
        :label="$t('quickSupport.downloadClient')"
        :disable="!settings.client_available"
        @click="download"
      />
      <q-btn
        flat
        color="negative"
        icon="key"
        :label="$t('quickSupport.settings.resetToken')"
        @click="resetToken"
      >
        <q-tooltip style="max-width: 320px">{{
          $t("quickSupport.settings.resetTokenTooltip")
        }}</q-tooltip>
      </q-btn>
    </q-card-section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import {
  fetchQuickSupportSettings,
  saveQuickSupportSettings,
  resetQuickSupportToken,
  downloadQuickSupportClient,
  type QuickSupportSettings,
} from "@/api/quicksupport";
import { notifySuccess } from "@/utils/notify";

const $q = useQuasar();
const { t } = useI18n();

const loaded = ref(false);
const saving = ref(false);
const settings = ref<QuickSupportSettings>({
  enabled: true,
  company_name: "",
  welcome_message: "",
  require_consent: false,
  show_privacy_bar: false,
  show_notification: false,
  session_timeout: 3,
  mesh_group_name: "",
  client_available: false,
});

async function load() {
  try {
    settings.value = await fetchQuickSupportSettings();
    loaded.value = true;
  } catch (e) {
    console.error(e);
  }
}

async function save() {
  saving.value = true;
  try {
    const { client_available, mesh_group_id, ...payload } = settings.value;
    void client_available;
    void mesh_group_id;
    await saveQuickSupportSettings(payload);
    notifySuccess(t("quickSupport.settings.saved"));
  } catch (e) {
    console.error(e);
  }
  saving.value = false;
}

function resetToken() {
  $q.dialog({
    title: t("quickSupport.settings.resetToken"),
    message: t("quickSupport.settings.resetTokenConfirm"),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await resetQuickSupportToken();
      notifySuccess(t("quickSupport.settings.tokenReset"));
    } catch (e) {
      console.error(e);
    }
  });
}

async function download() {
  try {
    await downloadQuickSupportClient();
  } catch (e) {
    console.error(e);
  }
}

onMounted(load);
</script>
