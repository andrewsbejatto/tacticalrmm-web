import axios from "axios";

const baseUrl = "/recordings";

export type RecordingSource = "mesh" | "rustdesk" | "qs_rustdesk";
export type RecordingStatus = "receiving" | "pending" | "uploaded" | "error";

export interface Recording {
  id: number;
  source: RecordingSource;
  status: RecordingStatus;
  kind: "mcrec" | "video";
  agent_id: string | null;
  hostname: string;
  client_name: string | null;
  site_name: string | null;
  technician_name: string;
  started: string;
  duration: number;
  size: number;
  filename: string;
  content_type: string;
  last_error: string;
}

export interface RecordingPage {
  total: number;
  page: number;
  page_size: number;
  results: Recording[];
}

export interface RecordingFilters {
  page?: number;
  page_size?: number;
  agent_id?: string;
  client?: number;
  site?: number;
  source?: RecordingSource | "";
  status?: RecordingStatus | "";
  from?: string;
  to?: string;
  search?: string;
}

export interface RecordingPlayLink {
  url: string;
  kind: "mcrec" | "video";
  content_type: string;
  filename: string;
  expires_in: number;
}

export interface RecordingSettings {
  enabled: boolean;
  record_mesh: boolean;
  record_rustdesk: boolean;
  record_qs: boolean;
  s3_endpoint: string;
  s3_region: string;
  s3_bucket: string;
  s3_prefix: string;
  s3_access_key: string;
  // write only: empty keeps the stored secret
  s3_secret?: string;
  s3_secret_set?: boolean;
  s3_path_style: boolean;
  s3_sse: boolean;
  presign_minutes: number;
  max_file_mb: number;
  boto3_installed?: boolean;
  mesh_dir_found?: boolean;
  pending?: number;
}

export async function fetchRecordings(
  filters: RecordingFilters,
): Promise<RecordingPage> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params[key] = value as string | number;
    }
  }
  const { data } = await axios.get(`${baseUrl}/`, { params });
  return data;
}

export async function fetchRecordingPlayLink(
  id: number,
): Promise<RecordingPlayLink> {
  const { data } = await axios.get(`${baseUrl}/${id}/play/`);
  return data;
}

export async function fetchRecordingSettings(): Promise<RecordingSettings> {
  const { data } = await axios.get(`${baseUrl}/settings/`);
  return data;
}

export async function saveRecordingSettings(
  payload: Partial<RecordingSettings>,
) {
  const { data } = await axios.put(`${baseUrl}/settings/`, payload);
  return data;
}

export async function testRecordingStorage(): Promise<{
  write: string;
  cors: string;
}> {
  const { data } = await axios.post(`${baseUrl}/settings/test/`);
  return data;
}

// page of the MeshCentral player (public/mcrec-player); the temporary link
// goes in the fragment so it never reaches a server log
export function mcrecPlayerUrl(link: RecordingPlayLink): string {
  const params = new URLSearchParams({ src: link.url, name: link.filename });
  return `/mcrec-player/index.html#${params.toString()}`;
}
