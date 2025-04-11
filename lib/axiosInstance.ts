import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Flag to prevent multiple concurrent refresh requests
let isRefreshing = false;
// Queue to hold requests that failed due to expired token while refreshing
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const axiosInstance = axios.create({
  // You can set a baseURL if your API calls consistently go to the same origin
  // baseURL: process.env.NEXT_PUBLIC_API_URL || "/api", // Example
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Add Authorization header
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle token expiration and refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  async (error: AxiosError) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Check if it's a 401 error and not a retry request
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // If already refreshing, add the request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest); // Retry with new token
          })
          .catch((err) => {
            return Promise.reject(err); // Propagate refresh error
          });
      }

      originalRequest._retry = true; // Mark as retry
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        console.error("No refresh token available.");
        isRefreshing = false;
        processQueue(error, null); // Reject queued requests
        // Handle logout or redirect to login here if needed
        // window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        console.log("Attempting token refresh...");
        const response = await axios.post("/api/auth/refresh", {
          // Use plain axios for refresh to avoid interceptor loop
          refreshToken: refreshToken,
        });

        const newAccessToken = response.data.accessToken; // Adjust based on actual response structure
        const newRefreshToken = response.data.refreshToken; // Optional: if refresh token rotation is used

        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        console.log("Token refresh successful.");
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        }
        processQueue(null, newAccessToken); // Resolve queued requests with new token
        return axiosInstance(originalRequest); // Retry the original request
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        processQueue(refreshError as AxiosError, null); // Reject queued requests
        // Handle logout or redirect to login here
        // window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For errors other than 401, just reject
    return Promise.reject(error);
  }
);

export default axiosInstance;
