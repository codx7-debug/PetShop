import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef } from 'react';
import { Button, View, Text, StyleSheet } from 'react-native';

export default function App() {
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
        <Text style={styles.message}>Camera permission is required.</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <CameraView style={styles.camera} ref={cameraRef} facing="back">
      <View style={styles.buttonContainer}>
        <Button title="Take Picture" onPress={takePicture}  />
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