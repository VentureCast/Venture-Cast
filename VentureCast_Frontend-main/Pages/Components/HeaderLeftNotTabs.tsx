// components/HeaderLeftNotTabs.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
type RootStackParamList = {
  Discover: undefined;
};

const HeaderLeftNotTabs = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <View style={styles.miniHeader}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButton}>←</Text>
      </TouchableOpacity>
  </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    fontSize: 34,
    color: '#fff',
    fontFamily: 'urbanist',
    marginRight: 20,
  },
  miniHeader: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    height: 44,
    paddingLeft: 20, 
    backgroundColor: 'transparent'
  },
});

export default HeaderLeftNotTabs;
