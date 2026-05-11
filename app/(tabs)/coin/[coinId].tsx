import React, { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { TradingScreen } from '@/src/screens/TradingScreen';

export default function CoinRoute() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return <TradingScreen />;
}
