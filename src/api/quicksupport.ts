import axios from "axios";
import { openURL } from "quasar";
import { router } from "@/router";
import { getCenteredWindowOptions } from "@/utils/helpers";

const baseUrl = "/quicksupport";

export interface QuickSupportSession {
  id: string;
  code: string;
  formatted_code: string;
  status: "waiting" | "connected" | "closed";
  hostname: string;
  username: string;
  os: string;
  client_ip: string | null;
  client_version: string;
  created: string;
  last_seen: string;
  connected_at: string | null;
  connected_by: string | null;
  install_status:
    | ""
    | "requested"
    | "approved"
    | "sent"
    | "done"
    | "failed"
    | "denied";
  install_site_name: string | null;
  install_message: string;
}

export interface QuickSupportSettings {
  enabled: boolean;
  company_name: string;
  welcome_message: string;
  require_consent: boolean;
  show_privacy_bar: boolean;
  show_notification: boolean;
  session_timeout: number;
  mesh_group_name: string;
  mesh_group_id?: string;
  client_available?: boolean;
}

export interface QuickSupportConnection {
  session: QuickSupportSession;
  control: string;
  terminal: string;
  file: string;
}

export async function fetchQuickSupportSessions(): Promise<
  QuickSupportSession[]
> {
  const { data } = await axios.get(`${baseUrl}/sessions/`);
  return data;
}

export async function connectQuickSupport(
  code: string,
): Promise<QuickSupportConnection> {
  const { data } = await axios.post(`${baseUrl}/connect/`, { code });
  return data;
}

export async function approveQuickSupportInstall(
  id: string,
  site: number,
  agenttype: string,
) {
  const { data } = await axios.post(`${baseUrl}/sessions/${id}/install/`, {
    approve: true,
    site,
    agenttype,
  });
  return data;
}

export async function denyQuickSupportInstall(id: string) {
  const { data } = await axios.post(`${baseUrl}/sessions/${id}/install/`, {
    approve: false,
  });
  return data;
}

export async function endQuickSupportSession(id: string) {
  const { data } = await axios.post(`${baseUrl}/sessions/${id}/end/`);
  return data;
}

export async function fetchQuickSupportSettings(): Promise<QuickSupportSettings> {
  const { data } = await axios.get(`${baseUrl}/settings/`);
  return data;
}

export async function saveQuickSupportSettings(
  payload: Partial<QuickSupportSettings>,
) {
  const { data } = await axios.put(`${baseUrl}/settings/`, payload);
  return data;
}

export async function resetQuickSupportToken() {
  const { data } = await axios.post(`${baseUrl}/settings/resettoken/`);
  return data;
}

export async function downloadQuickSupportClient() {
  const response = await axios.get(`${baseUrl}/download/`, {
    responseType: "blob",
  });
  const disposition: string = response.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : "QuickSupport.exe";

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(new Blob([response.data]));
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(link.href);
}

// opens the remote control window for a support code
export function openQuickSupportControl(code: string) {
  const url = router.resolve(`/quicksupport/${code}`).href;
  openURL(url, undefined, {
    ...getCenteredWindowOptions(1600, 900),
  });
}
