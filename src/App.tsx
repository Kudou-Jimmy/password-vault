import { useVault } from '@/contexts/VaultContext';
import LockScreen from '@/ui/components/LockScreen';
import MainLayout from '@/ui/layouts/MainLayout';

export default function App() {
  const { isLocked } = useVault();

  return isLocked ? <LockScreen /> : <MainLayout />;
}
