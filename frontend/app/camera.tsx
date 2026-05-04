import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef } from 'react';
import { Button, View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

export default function App() {
  const { t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);


  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      console.log(photo.uri);
      
    }
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('camera.permMessage')}</Text>
        <Button title={t('camera.grantPerm')} onPress={requestPermission} />
      </View>
    );
  }

  return (
    <CameraView style={styles.camera} ref={cameraRef} facing="back">
      <View style={styles.buttonContainer}>
        <Button title={t('camera.takePicture')} onPress={takePicture} />
      </View>
    </CameraView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginBottom: 16,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 32,

  },
});