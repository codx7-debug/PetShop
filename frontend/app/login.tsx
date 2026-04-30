import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Rect, Ellipse, Circle } from "react-native-svg";

function PawIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Ellipse cx={9} cy={6} rx={3.5} ry={4.5} fill="white" opacity={0.9} />
      <Ellipse cx={19} cy={6} rx={3.5} ry={4.5} fill="white" opacity={0.9} />
      <Ellipse cx={5} cy={13} rx={4.5} ry={3.5} fill="white" opacity={0.9} />
      <Ellipse cx={23} cy={13} rx={4.5} ry={3.5} fill="white" opacity={0.9} />
      <Path
        d="M14 11c-4.5 0-7 2.5-7 5.5 0 4 3.5 6.5 7 6.5s7-2.5 7-6.5c0-3-2.5-5.5-7-5.5z"
        fill="white"
      />
    </Svg>
  );
}

function ChevronLeft() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M10 12L6 8l4-4"
        stroke="#444"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Rect x={3} y={8} width={26} height={16} rx={4} stroke="#333" strokeWidth={2.2} fill="#fff" />
    <Path d="M3 12l13 8 13-8" stroke="#333" strokeWidth={2.2} />
  </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Rect
      x={8}
      y={18}
      width={24}
      height={18}
      rx={4}
      stroke="#222"
      strokeWidth={2.5}
      fill="#fff"
    />
    <Path
      d="M15 18v-5a5 5 0 1110 0v5"
      stroke="#222"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  </Svg>
  );
}

function EyeIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Ellipse cx={7} cy={7} rx={6} ry={4} stroke="#aaa" strokeWidth={1.2} />
      <Circle cx={7} cy={7} r={1.8} stroke="#aaa" strokeWidth={1.2} />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 15 15">
      <Path
        d="M14.5 7.7c0-.5-.04-1-.12-1.46H7.5v2.77h3.93a3.36 3.36 0 01-1.46 2.2v1.83h2.36c1.38-1.27 2.17-3.14 2.17-5.34z"
        fill="#4285F4"
      />
      <Path
        d="M7.5 14.5c1.97 0 3.63-.65 4.83-1.76l-2.36-1.83c-.65.44-1.49.7-2.47.7-1.9 0-3.51-1.28-4.09-3h-2.4v1.89A7.5 7.5 0 007.5 14.5z"
        fill="#34A853"
      />
      <Path
        d="M3.41 9.61a4.5 4.5 0 010-2.9V4.82H1.01a7.5 7.5 0 000 5.68l2.4-1.89z"
        fill="#FBBC05"
      />
      <Path
        d="M7.5 3.38c1.07 0 2.03.37 2.79 1.08l2.09-2.09A7.5 7.5 0 001 4.82l2.4 1.89C3.99 4.66 5.6 3.38 7.5 3.38z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={13} height={15} viewBox="0 0 13 16" fill="none">
      <Path
        d="M10.77 8.5c-.02-1.73.95-3.02 2.23-3.77-.86-1.22-2.15-1.9-3.85-2.03-1.6-.12-3.35 1-3.97 1-.65 0-1.74-1-3.1-.97-1.57.03-3.07.93-3.87 2.35-1.67 2.87-.43 7.1 1.18 9.42.8 1.14 1.73 2.42 2.95 2.38 1.2-.05 1.63-.76 3.07-.76s1.83.76 3.06.74c1.28-.02 2.08-1.14 2.85-2.29.57-.82.8-1.23 1.23-2.15-3.21-1.22-3.77-3.92-3.78-5.93z"
        fill="#1F1F1F"
      />
      <Path
        d="M8.93 2.53C9.59 1.74 10.05.57 9.9-.5c-1.03.06-2.28.72-3.01 1.53-.66.73-1.23 1.93-1.07 3.04 1.15.1 2.4-.6 3.11-1.54z"
        fill="#1F1F1F"
      />
    </Svg>
  );
}





export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        {/* <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft />
        </TouchableOpacity> */}

        <View style={styles.logoBox}>
          <PawIcon />
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Log in to guide emergency care and coordinate support for injured pets.
        </Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}>
          <EmailIcon />
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#9A9A9A"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <LockIcon />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9A9A9A"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <EyeIcon />
          </TouchableOpacity>
        </View>

        <View style={styles.rowBetween}>
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/home")}>
          <Text style={styles.loginButtonText} >Log in</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton}>
            <GoogleIcon />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <AppleIcon />
            <Text style={styles.socialText}>Apple</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/sign")}>
            <Text style={styles.bottomLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6E3D7",
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 90,
    paddingBottom: 22,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#E0DDD0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  logoBox: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "#2F8E67",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 42,
    fontWeight: "400",
    color: "#111111",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#777777",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 22,
  },
  label: {
    fontSize: 18,
    color: "#2E2E2E",
    marginBottom: 7,
    fontWeight: "400",
  },
  inputWrap: {
    height: 54,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#DDD9CC",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: "#252525",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 16,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#B5B2A5",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#2F8E67",
    borderColor: "#2F8E67",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 12,
  },
  rememberText: {
    fontSize: 15,
    color: "#555555",
  },
  forgotText: {
    fontSize: 15,
    color: "#2F8E67",
    fontWeight: "400",
  },
  loginButton: {
    backgroundColor: "#2F8E67",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "500",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: "#D8D5C8",
  },
  dividerText: {
    fontSize: 14,
    color: "#999999",
  },
  socialRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#DDD9CC",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  socialText: {
    fontSize: 18,
    color: "#333333",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  bottomText: {
    color: "#777777",
    fontSize: 16,
  },
  bottomLink: {
    color: "#2F8E67",
    fontSize: 16,
    fontWeight: "600",
  },
});