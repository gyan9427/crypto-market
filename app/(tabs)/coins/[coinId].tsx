import React, { useLayoutEffect } from 'react';
import { useNavigation } from "expo-router/react-navigation";
import { TradingScreen } from '@/src/screens/TradingScreen';

export default function CoinsRoute() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return <TradingScreen />;
}
