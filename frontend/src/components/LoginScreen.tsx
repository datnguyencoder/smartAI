import { Button, Card, Form, Input, Typography, message } from 'antd';
import * as React from 'react';
import { Store } from 'lucide-react';
import { login } from '../services/wmsApi';
import { setToken } from '../services/apiClient';
import type { UserDto } from '../types/api';

type Props = {
  onSuccess: (user: UserDto) => void;
};

export function LoginScreen({ onSuccess }: Props) {
  const [loading, setLoading] = React.useState(false);

  const handleFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const auth = await login(values.username, values.password);
      setToken(auth.accessToken);
      localStorage.setItem('smartmart_user', JSON.stringify(auth.user));
      onSuccess(auth.user);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Đăng nhập thất bại';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4] p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-[#006c49] flex items-center justify-center text-white">
            <Store size={28} />
          </div>
          <div>
            <Typography.Title level={4} className="!mb-0">SmartMart WMS</Typography.Title>
            <Typography.Text type="secondary">Đăng nhập để tiếp tục</Typography.Text>
          </div>
        </div>
        <Form layout="vertical" onFinish={handleFinish} initialValues={{ username: 'staff', password: 'staff123' }}>
          <Form.Item name="username" label="Tài khoản" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
            <Input.Password size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large" className="!bg-[#006c49]">
            Đăng nhập
          </Button>
        </Form>
        <Typography.Paragraph type="secondary" className="!mt-4 !mb-0 text-xs">
          POS: staff / staff123 · Nhập kho: warehouse / warehouse123
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
