import { Button, Card, Form, Input, Typography, message } from 'antd';
import * as React from 'react';
import { Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Props = {
  onSuccess: () => void;
};

export function LoginScreen({ onSuccess }: Props) {
  const [loading, setLoading] = React.useState(false);
  const { login } = useAuth();

  const handleFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Đăng nhập thất bại';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/media/smartmart-login-background.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-slate-950/45" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/75 via-slate-950/20 to-slate-950/70" />

      <main className="relative z-10 flex min-h-screen items-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_460px]">
          <section className="hidden max-w-xl text-white lg:block">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
              SmartMart Operations
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight drop-shadow-lg xl:text-5xl">
              Vận hành cửa hàng thông minh, trong một không gian duy nhất.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/80 drop-shadow-md">
              Quản lý bán hàng, kho và hoạt động cửa hàng nhanh chóng với SmartMart WMS.
            </p>
          </section>

          <Card className="w-full !rounded-[28px] !border-white/50 !bg-white/90 !shadow-[0_28px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl [&_.ant-card-body]:!p-6 sm:[&_.ant-card-body]:!p-9">
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00875f] to-[#005c43] text-white shadow-lg shadow-emerald-900/20">
                <Store size={30} />
              </div>
              <div>
                <Typography.Title level={3} className="!mb-0 !text-[26px] !font-bold !tracking-tight !text-slate-900">
                  SmartMart WMS
                </Typography.Title>
                <Typography.Text className="!text-sm !text-slate-500">Đăng nhập để tiếp tục</Typography.Text>
              </div>
            </div>

            <Form layout="vertical" onFinish={handleFinish} requiredMark="optional">
              <Form.Item
                className="!mb-5 [&_.ant-form-item-label>label]:!font-semibold [&_.ant-form-item-label>label]:!text-slate-700"
                name="username"
                label="Tài khoản"
                rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
              >
                <Input
                  className="!h-12 !rounded-xl !border-slate-200 !bg-white/80 !px-4 hover:!border-emerald-600 focus:!border-emerald-600"
                  size="large"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                className="!mb-6 [&_.ant-form-item-label>label]:!font-semibold [&_.ant-form-item-label>label]:!text-slate-700"
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              >
                <Input.Password
                  className="!h-12 !rounded-xl !border-slate-200 !bg-white/80 !px-4 hover:!border-emerald-600 focus-within:!border-emerald-600"
                  size="large"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="!h-12 !rounded-xl !border-[#006c49] !bg-[#006c49] !text-base !font-semibold !shadow-lg !shadow-emerald-900/15 hover:!border-[#00563a] hover:!bg-[#00563a]"
              >
                Đăng nhập
              </Button>
            </Form>

            <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
              <Typography.Paragraph className="!mb-0 !text-xs !leading-5 !text-slate-500">
                POS: staff / staff123 · Nhập kho: warehouse / warehouse123
              </Typography.Paragraph>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
