import { Spinner } from '@heroui/react'; // 根据 HeroUI 的文档导入组件

import { useLoading } from '../contexts/LoadingContext';

const GlobalLoading = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <Spinner size="lg" />
    </div>
  );
};

export default GlobalLoading;
