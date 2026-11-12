<template>
  <q-dialog ref="dialogRef" maximized @hide="onDialogHide">
    <q-card class="column no-wrap">
      <q-bar>
        <q-icon name="smart_display" class="q-mr-sm" />
        {{ title }}
        <q-space />
        <q-btn
          dense
          flat
          icon="open_in_new"
          :href="externalUrl"
          target="_blank"
          rel="noopener"
        >
          <q-tooltip>{{ $t("recordings.openNewWindow") }}</q-tooltip>
        </q-btn>
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>{{ $t("common.close") }}</q-tooltip>
        </q-btn>
      </q-bar>
      <div class="col bg-black flex flex-center">
        <video
          v-if="link.kind === 'video'"
          :src="link.url"
          controls
          autoplay
          style="max-width: 100%; max-height: 100%"
        />
        <iframe
          v-else
          :src="playerUrl"
          style="width: 100%; height: 100%; border: 0"
          referrerpolicy="no-referrer"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDialogPluginComponent } from "quasar";
import { mcrecPlayerUrl, type RecordingPlayLink } from "@/api/recordings";

const props = defineProps<{ link: RecordingPlayLink; title: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide } = useDialogPluginComponent();

const playerUrl = computed(() => mcrecPlayerUrl(props.link));
const externalUrl = computed(() =>
  props.link.kind === "video" ? props.link.url : playerUrl.value,
);
</script>
