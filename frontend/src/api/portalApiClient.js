import axios from "axios";

const portalApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

portalApiClient.interceptors.request.use((config) => {
  const portalToken = sessionStorage.getItem("portalToken");

  if (portalToken) {
    config.headers.Authorization = `Bearer ${portalToken}`;
  }

  return config;
});

export default portalApiClient;