import { AnimatedSplash } from '@/src/components/splash/AnimatedSplash';
import { useSplashStore } from '@/src/state/useSplashStore';

export default function SplashRoute() {
  const markDone = useSplashStore((s) => s.markDone);
  return <AnimatedSplash onDone={markDone} />;
}
