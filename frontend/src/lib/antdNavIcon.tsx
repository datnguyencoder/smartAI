import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import type { ComponentType } from 'react';

/** Bọc icon Ant Design để dùng chung với nav/KPI (prop `size` giống Lucide). */
export function antdNavIcon(Icon: ComponentType<AntdIconProps>) {
  return function AntdNavIcon({ size = 18 }: { size?: number }) {
    return <Icon style={{ fontSize: size }} />;
  };
}
