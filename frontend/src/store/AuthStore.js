import { create } from "zustand";


const useAuthStore = create((set) => ({
  user: null,
  token: null,
  role: "client", // Default role
  loading: true,

  // Login function
  login: (userInfo) => {
    set({
      user: userInfo.user,
      token: userInfo.token,
      role: userInfo.role,
      loading: false,
    });
    localStorage.setItem("token", userInfo.token);
    localStorage.setItem("user", JSON.stringify(userInfo.user));
    localStorage.setItem("role", userInfo.role);
  },

  // Logout function
  logout: () => {
    set({
      user: null,
      token: null,
      role: "client",
      loading: false,
    });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  },

  // Initialize authentication state from localStorage
  init: () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const role = localStorage.getItem("role") || "client"; // Default role if not set

    if (token && user) {
      set({
        user: JSON.parse(user),
        token,
        role,
        loading: false,
      });
    } else {
      set({ loading: false });
    }
  }
}));

export default useAuthStore;
