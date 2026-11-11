<template>
  <div>
    <q-bar>
      <q-icon name="support_agent" />
      <span class="text-caption q-ml-xs">
        {{ $t("quickSupport.title") }}
        <template v-if="session">
          — <b>{{ session.formatted_code }}</b> · {{ session.hostname }} ·
          {{ session.username }}
        </template>
      </span>
      <q-space />
      <template v-if="control">
        <q-btn-toggle
          v-model="view"
          dense
          flat
          size="sm"
          toggle-color="primary"
          class="q-mr-md"
          :options="[
            { label: $t('quickSupport.views.desktop'), value: 'control' },
            { label: $t('quickSupport.views.terminal'), value: 'terminal' },
            { label: $t('quickSupport.views.files'), value: 'file' },
          ]"
        />
        <q-btn
          size="sm"
          color="negative"
          icon="stop_circle"
          :label="$t('quickSupport.endSession')"
          @click="endSession"
        />
      </template>
      <q-space />
    </q-bar>

    <div
      v-if="error"
      class="column items-center justify-center q-pa-xl text-center"
      :style="{ height: `${$q.screen.height - 26}px` }"
    >
      <q-icon name="link_off" size="64px" color="grey" />
      <div class="text-h6 q-mt-md">{{ error }}</div>
      <q-btn
        class="q-mt-lg"
        color="primary"
        icon="refresh"
        :label="$t('quickSupport.tryAgain')"
        @click="connect"
      />
    </div>

    <div
      v-else
      class="q-video"
      :style="{ height: `${$q.screen.height - 26}px` }"
    >
      <iframe
        v-show="currentUrl"
        :src="currentUrl"
        allow="clipboard-read; clipboard-write"
        allowfullscreen
        frameborder="0"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useMeta, useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import {
  connectQuickSupport,
  endQuickSupportSession,
  type QuickSupportSession,
} from "@/api/quicksupport";
import { fetchDashboardInfo } from "@/api/core";
import { notifySuccess } from "@/utils/notify";

const $q = useQuasar();
const { t } = useI18n();
const { params } = useRoute();

const session = ref<QuickSupportSession | null>(null);
const urls = ref<{ control: string; terminal: string; file: string } | null>(
  null,
);
const view = ref<"control" | "terminal" | "file">("control");
const error = ref("");

const control = computed(() => urls.value?.control || "");
const currentUrl = computed(() => (urls.value ? urls.value[view.value] : ""));

async function connect() {
  error.value = "";
  $q.loading.show({ message: t("quickSupport.connecting") });
  try {
    const data = await connectQuickSupport(String(params.code));
    session.value = data.session;
    urls.value = {
      control: data.control,
      terminal: data.terminal,
      file: data.file,
    };
    useMeta({
      title: `${data.session.hostname} - ${data.session.formatted_code} | ${t(
        "quickSupport.title",
      )}`,
    });
  } catch (e: unknown) {
    const err = e as { response?: { data?: unknown } };
    error.value =
      typeof err?.response?.data === "string"
        ? err.response.data
        : t("quickSupport.connectFailed");
  }
  $q.loading.hide();
}

function endSession() {
  if (!session.value) return;
  $q.dialog({
    title: t("quickSupport.endSession"),
    message: t("quickSupport.endSessionConfirm", {
      hostname: session.value.hostname,
      code: session.value.formatted_code,
    }),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await endQuickSupportSession(session.value!.id);
      urls.value = null;
      error.value = t("quickSupport.sessionEnded");
      notifySuccess(t("quickSupport.sessionEnded"));
      // this window was opened by the dashboard (window.open), so it can be
      // closed by script. If the browser refuses (e.g. it was opened as a
      // normal tab), the "session ended" message stays on screen.
      setTimeout(() => window.close(), 800);
    } catch (e) {
      console.error(e);
    }
  });
}

onMounted(async () => {
  try {
    const { dark_mode } = await fetchDashboardInfo();
    $q.dark.set(dark_mode);
  } catch {
    // ignore
  }
  connect();
});
</script>
