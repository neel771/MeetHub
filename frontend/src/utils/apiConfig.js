const DEFAULT_BACKEND_PORT = 8000;

const getHost = () => {
  // If user defined REACT_APP_API_URL, use it directly (override auto-detect)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/+$/, "");
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const host = window.location.hostname;

  // Use deployed backend port
  return `${protocol}//${host}:${DEFAULT_BACKEND_PORT}`;
};

export const getAPIBaseURL = () => {
  const url = `${getHost()}/api/v1/users`;
  console.log("API Configuration: ", { apiBaseURL: url });
  return url;
};

export const getSocketServerURL = () => {
  const url = getHost();
  console.log("Socket Configuration: ", { socketURL: url });
  return url;
};
