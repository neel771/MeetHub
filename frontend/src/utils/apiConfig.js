const DEFAULT_BACKEND_PORT = 8000;

const getHost = () => {
  if (process.env.NODE_ENV === "production") {
    return "https://meethub-x07k.onrender.com";
  }

  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/+$/, "");
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const host = window.location.hostname;
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
