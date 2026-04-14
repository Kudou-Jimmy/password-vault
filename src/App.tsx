import { useVault } from '@/contexts/VaultContext';
import LockScreen from '@/ui/components/LockScreen';
import MainLayout from '@/ui/layouts/MainLayout';

export default function App() {
  const { isLocked, isLoading } = useVault();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vault-bg">
        <div className="text-vault-text-secondary">載入中...</div>
      </div>
    );
  }

  return isLocked ? <LockScreen /> : <MainLayout />;
}
