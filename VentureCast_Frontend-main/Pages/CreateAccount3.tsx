import { RNCamera } from 'react-native-camera';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const CameraScreen = ({ navigation, route }: any) => {
  let cameraRef: any = null;
  // const { originScreen } = route.params;
  const takePicture = async () => {
    if (cameraRef) {
      const options = { quality: 0.5, base64: true };
      const data = await cameraRef.takePictureAsync(options);
      console.log(data.uri); // Log or handle the picture URI

      // Navigate to UploadGovernmentIDScreen with the captured image
      navigation.navigate('UploadGovernmentIDScreen', { imageUri: data.uri });
    }
  };

  return (
    <View style={styles.container}>
      <RNCamera
        ref={ref => {
          cameraRef = ref;
        }}
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        captureAudio={false}
      >
        {({ status }) => {
          if (status !== 'READY') return <Text style={styles.loadingText}>Waiting...</Text>;
          return (
            <View style={styles.overlayContainer}>
              {/* Add the overlay effect */}
              <View style={styles.frameContainer}>
                <View style={styles.topOverlay}></View>
                <View style={styles.centerRow}>
                  <View style={styles.sideOverlay}></View>
                  <View style={styles.centerFrame}>
                    {/* Center frame where document should be placed */}
                    <Text style={styles.frameText}>Place your ID here</Text>
                  </View>
                  <View style={styles.sideOverlay}></View>
                </View>
                <View style={styles.bottomOverlay}></View>
              </View>

              {/* Capture button */}
              <View style={styles.captureButtonContainer}>
                <TouchableOpacity onPress={() => takePicture()} style={styles.capture}>
                  <Text style={styles.captureText}>SNAP</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      </RNCamera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    alignSelf: 'center',
    marginTop: '50%',
  },
  // Overlay container for the frame effect
  overlayContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  topOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Blurred top section
  },
  sideOverlay: {
    width: '15%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Blurred side sections
  },
  bottomOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Blurred bottom section
  },
  centerFrame: {
    width: '70%',
    height: '50%',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  capture: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 20,
    paddingHorizontal: 30,
    alignSelf: 'center',
    margin: 20,
  },
  captureText: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },
});

export default CameraScreen;
