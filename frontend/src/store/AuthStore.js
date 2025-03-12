import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  role: "client", // Default role
  loading: true,

  // ✅ Login Function (Stores in Zustand & LocalStorage)
  login: (userInfo) => {
    localStorage.setItem("token", userInfo.token);
    localStorage.setItem("user", JSON.stringify(userInfo.user));
    localStorage.setItem("role", userInfo.role);

    set({
      user: userInfo.user,
      token: userInfo.token,
      role: userInfo.role,
      loading: false,
    });
  },

  // ✅ Logout Function (Clears Zustand & LocalStorage)
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    set({
      user: null,
      token: null,
      role: "client",
      loading: false,
    });
  },

  // ✅ Initialize Authentication State on App Load
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
  },
}));

export default useAuthStore;