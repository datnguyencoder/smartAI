import { Button, Form, Input, message as antdMessage } from 'antd';
import * as React from 'react';
import { Card } from '@/components/ui';
import { fetchSettings, updateSetting } from '@/services/wmsApi';

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<Array<{ key: string; value: string; description?: string }>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchSettings()
      .then((rows) => setSettings(rows.map((r) => ({ key: r.key, value: r.value, description: r.description }))))
      .catch(() => setSettings([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string, value: string) => {
    try {
      await updateSetting(key, value);
      antdMessage.success('Đã lưu cấu hình');
      setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  };

  if (loading) {
    return <Card className="p-8 text-center text-muted">Đang tải cấu hình...</Card>;
  }

  if (settings.length === 0) {
    return (
      <Card className="p-8 text-center text-muted">
        Chưa có cấu hình trong hệ thống. Thêm bản ghi vào bảng settings (Flyway V3).
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {settings.map((setting) => (
        <Card className="p-5" key={setting.key}>
          <h3 className="text-lg font-semibold mb-1">{setting.key}</h3>
          {setting.description && <p className="text-sm text-muted mb-4">{setting.description}</p>}
          <Form layout="vertical" onFinish={(vals) => handleSave(setting.key, vals.value)}>
            <Form.Item label="Giá trị" name="value" initialValue={setting.value}>
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit">Lưu</Button>
          </Form>
        </Card>
      ))}
    </div>
  );
}
