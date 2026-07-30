import apiClient from "../api/apiClient";
import { downloadBlob } from "./downloadFile.js";

export async function exportCSV(endpoint, filename) {
  const response = await apiClient.get(endpoint, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: "text/csv;charset=utf-8;",
  });

  downloadBlob(blob, filename);
}