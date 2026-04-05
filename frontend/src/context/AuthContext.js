import { createContext, useEffect, useReducer } from "react";

const storedUser = localStorage.getItem("user");
let parsedUser = null;
if (storedUser) {
  try {
    parsedUser = JSON.parse(storedUser);
  } catch (e) {
    parsedUser = null;
  }
}

const initial_state = {
  user: parsedUser,
  loading: false,
  error: null,
  userRole: localStorage.getItem("userRole") || null,
};

export const AuthContext = createContext(initial_state);

const AuthReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        user: null,
        loading: true,
        error: null,
        userRole: null,
      };
    case "LOGIN_SUCCESS":
      return {
        user: action.payload,
        loading: false,
        error: null,
        userRole: action.payload?.role || null,
      };
    case "LOGIN_FAILURE":
      return {
        user: null,
        loading: false,
        error: action.payload,
        userRole: null,
      };
    case "REGISTER_START":
      return {
        user: null,
        loading: true,
        error: null,
        userRole: null,
      };
    case "REGISTER_SUCCESS":
      return {
        user: action.payload,
        loading: false,
        error: null,
        userRole: action.payload?.role || null,
      };
    case "REGISTER_FAILURE":
      return {
        user: null,
        loading: false,
        error: action.payload,
        userRole: null,
      };
    case "LOGOUT":
      return {
        user: null,
        loading: false,
        error: null,
        userRole: null,
      };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        userRole: action.payload?.role || null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AuthReducer, initial_state);

  useEffect(() => {
    if (state.user === null) {
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
    } else {
      localStorage.setItem("user", JSON.stringify(state.user));
      localStorage.setItem("userRole", state.userRole || "");
    }
  }, [state.user, state.userRole]);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        error: state.error,
        userRole: state.userRole,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
