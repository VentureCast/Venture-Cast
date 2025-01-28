import React, { useRef, useState } from 'react';
import { StyleSheet, View, FlatList, Dimensions } from 'react-native';
import Video from 'react-native-video';

const { height } = Dimensions.get('window');

const videos = [
  { id: '1', uri: 'https://www.example.com/video1.mp4' },
  { id: '2', uri: 'https://www.example.com/video2.mp4' },
  { id: '3', uri: 'https://www.example.com/video3.mp4' },
];

const ClipsScrollPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use typeof Video to refer to the component type
  const videoRefs = useRef<(typeof Video | null)[]>([]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.videoContainer}>
      <Video
        ref={(ref) => (videoRefs.current[index] = ref || null)}
        source={{ uri: item.uri }}
        style={styles.video}
        resizeMode="cover"
        paused={currentIndex !== index} // Autoplay the current video
        repeat
      />
    </View>
  );

  return (
    <FlatList
      data={videos}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      decelerationRate="fast"
    />
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    height: '100%',
    width: '100%',
  },
});

export default ClipsScrollPage;
