import { Button, Collapse, Form, Input, InputNumber, message as antdMessage } from 'antd';
import * as React from 'react';
import { Card } from '@/components/ui';
import { fetchSettings, updateSetting } from '@/services/wmsApi';

const RECEIPT_KEYS = [
  { key: 'store_name', label: 'Tên cửa hàng' },
  { key: 'store_address', label: 'Địa chỉ cửa hàng' },
  { key: 'store_phone', label: 'Hotline' },
  { key: 'receipt_footer', label: 'Chân hóa đơn', multiline: true },
  { key: 'paper_width', label: 'Khổ giấy in (vd: 80mm)' },
];

const POS_KEYS = [
  { key: 'vat_rate', label: 'Thuế VAT (%)', number: true },
  { key: 'loyalty_earn_rate', label: 'Tỷ lệ tích điểm (điểm/1000đ)', number: true },
];

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<Record<string, { value: string; description?: string }>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchSettings()
      .then((rows) => {
        const map: Record<string, { value: string; description?: string }> = {};
        rows.forEach((r) => { map[r.key] = { value: r.value, description: r.description }; });
        setSettings(map);
      })
      .catch(() => setSettings({}))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string, value: string) => {
    try {
      await updateSetting(key, value);
      antdMessage.success('Đã lưu cấu hình');
      setSettings((prev) => ({ ...prev, [key]: { ...prev[key], value } }));
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  };

  const renderGroup = (title: string, keys: Array<{ key: string; label: string; multiline?: boolean; number?: boolean }>) => (
    <Card className="p-5" key={title}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {keys.map((def) => {
          const current = settings[def.key]?.value ?? '';
          return (
            <Form
              key={def.key}
              layout="vertical"
              initialValues={{ value: current }}
              onFinish={(vals) => handleSave(def.key, String(vals.value ?? ''))}
            >
              <Form.Item label={def.label} name="value" extra={settings[def.key]?.description}>
                {def.multiline ? (
                  <Input.TextArea rows={3} />
                ) : def.number ? (
                  <InputNumber className="w-full" />
                ) : (
                  <Input />
                )}
              </Form.Item>
              <Button type="primary" htmlType="submit" size="small">Lưu</Button>
            </Form>
          );
        })}
      </div>
    </Card>
  );

  if (loading) {
    return <Card className="p-8 text-center text-muted">Đang tải cấu hình...</Card>;
  }

  const otherKeys = Object.keys(settings).filter(
    (k) => !RECEIPT_KEYS.some((r) => r.key === k) && !POS_KEYS.some((p) => p.key === k)
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {renderGroup('Hóa đơn & cửa hàng', RECEIPT_KEYS)}
        {renderGroup('POS & thuế', POS_KEYS)}
      </div>
      {otherKeys.length > 0 && (
        <Collapse
          items={[{
            key: 'other',
            label: `Cấu hình khác (${otherKeys.length})`,
            children: (
              <div className="grid gap-4 lg:grid-cols-2">
                {otherKeys.map((key) => (
                  <Card className="p-5" key={key}>
                    <h3 className="text-lg font-semibold mb-1">{key}</h3>
                    {settings[key]?.description && <p className="text-sm text-muted mb-4">{settings[key].description}</p>}
                    <Form layout="vertical" initialValues={{ value: settings[key]?.value }} onFinish={(vals) => handleSave(key, vals.value)}>
                      <Form.Item label="Giá trị" name="value"><Input /></Form.Item>
                      <Button type="primary" htmlType="submit">Lưu</Button>
                    </Form>
                  </Card>
                ))}
              </div>
            ),
          }]}
        />
      )}
      {Object.keys(settings).length === 0 && (
        <Card className="p-8 text-center text-muted">
          Chưa có cấu hình trong hệ thống. Thêm bản ghi vào bảng settings (Flyway V3).
        </Card>
      )}
    </div>
  );
}
