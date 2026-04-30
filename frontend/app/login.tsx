import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Image, KeyboardAvoidingView, Platform, Dimensions, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Ensure expo-blur is installed
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <View style={styles.container}>
      {/* --- Abstract Background Shapes --- */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* --- Logo Header --- */}
          <View style={styles.logoContainer}>
            <View style={styles.logoFrame}>
              <Image 
                source={require("../components/logo2.png")} // Replace with your extracted logo
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Petora</Text>
            <Text style={styles.tagline}>Dostlarınız için en iyisi.</Text>
          </View>

          {/* --- Glassmorphism Card --- */}
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>{isLogin ? 'Tekrar Hoşgeldin!' : 'Aramıza Katıl'}</Text>
            
            <View style={styles.inputWrapper}>
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
                  <TextInput 
                    placeholder="Ad Soyad" 
                    style={styles.input}
                    placeholderTextColor="#9EB2C9" // clearer placeholder color
                  />
                </View>
          
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                <TextInput 
                  placeholder="E-posta" 
                  style={styles.input}
                  keyboardType="email-address"
                  placeholderTextColor="#9EB2C9" // more clear placeholder color
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
                <TextInput 
                  placeholder="Şifre" 
                  style={styles.input} 
                  secureTextEntry 
                  placeholderTextColor="#9EB2C9" // more clear placeholder color
                />
              </View>
            </View>
     

            {isLogin && (
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Şifremi Unuttum?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.mainBtn} activeOpacity={0.8} onPress={() => router.push("/home")}>
              <Text style={styles.mainBtnText}>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>

            {/* --- Social Login --- */}
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Ionicons name="logo-apple" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* --- Toggle Login/Signup --- */}
          <TouchableOpacity 
            style={styles.toggleBtn} 
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.toggleText}>
              {isLogin ? 'Hesabın yok mu? ' : 'Zaten üye misin? '}
              <Text style={styles.toggleTextBold}>{isLogin ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F5F9' },
  // Background Decorations
  circle1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#E3FFF3' },
  circle2: { position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFE7E4' },
  
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40, paddingTop: 60 },
  
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoFrame: {
    width: 90, height: 90, backgroundColor: '#FFF', borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
    borderTopLeftRadius: 40, borderBottomRightRadius: 40 // Fancy Leaf Shape
  },
  logo: { width: 90, height: 90 },
  brandName: { fontSize: 32, fontWeight: '900', color: '#0A2540', marginTop: 15 },
  tagline: { fontSize: 14, color: '#666', fontWeight: '500' },

  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 35, padding: 25,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 5
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#0A2540', marginBottom: 25, textAlign: 'center' },
  
  inputWrapper: { gap: 15 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#FFF', borderRadius: 18, 
    paddingHorizontal: 15, height: 55,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  
  forgotBtn: { alignSelf: 'flex-end', marginTop: 12 },
  forgotText: { color: '#FE6E40', fontWeight: '700', fontSize: 13 },

  mainBtn: {
    backgroundColor: '#2B9B7A', height: 55, borderRadius: 18,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 25, gap: 10,
    shadowColor: '#2B9B7A', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8
  },
  mainBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { marginHorizontal: 10, color: '#AAA', fontWeight: '600' },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  socialBtn: {
    width: 60, height: 60, backgroundColor: '#FFF', borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#F0F0F0'
  },

  toggleBtn: { marginTop: 30, alignItems: 'center' },
  toggleText: { fontSize: 14, color: '#666' },
  toggleTextBold: { color: '#FE6E40', fontWeight: '800' }
});