import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string | null;
  email: string | null;
  fullName: string | null;
  isPremium: boolean;
}

interface UserContextType {
  user: User;
  setUser: (user: User) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUserState] = useState<User>({
    id: null,
    email: null,
    fullName: null,
    isPremium: false,
  });

  // Load user from localStorage on app initialization
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserState(JSON.parse(storedUser));
    }
  }, []);

  const setUser = (user: User) => {
    setUserState(user);
    localStorage.setItem("user", JSON.stringify(user)); // Persist user in localStorage
  };

  const clearUser = () => {
    setUserState({ id: null, email: null, fullName: null, isPremium: false });
    localStorage.removeItem("user"); // Clear user from localStorage
  };

  return (
    <UserContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
