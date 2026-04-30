// import React, { createContext, useContext } from "react";
// import { Appearance } from "react-native";

// export type ThemeMode = "light" | "dark";

// type ThemeContextType = {
//   theme: ThemeMode;
//   setTheme: (theme: ThemeMode) => void;
// };

// export const ThemeContext = createContext<ThemeContextType>({
//   theme: "light",
//   setTheme: () => {},
// });

// export const useTheme = () => useContext(ThemeContext);

// export function ThemeProvider({ children }: { children: React.ReactNode }) {
//   const systemScheme = Appearance.getColorScheme();
//   const [theme, setTheme] = React.useState<ThemeMode>(systemScheme || "light");

//   return (
//     <ThemeContext.Provider value={{ theme, setTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// }