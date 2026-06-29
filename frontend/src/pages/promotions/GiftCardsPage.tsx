import * as React from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { CreditCard, Plus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { fetchGiftCards, issueGiftCard, redeemGiftCard } from '@/services/wmsApi';
import type { GiftCardDto } from '@/types/api';

export default function GiftCardsPage() {
  const [rows, setRows] = React.useState<GiftCardDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [issueOpen, setIssueOpen] = React.useState(false);
  const [redeemOpen, setRedeemOpen] = React.useState(false);
  const [issueForm] = Form.useForm();
  const [redeemForm] = Form.useForm();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchGiftCards());
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải thẻ quà tặng');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleIssue = async () => {
    const values = await issueForm.validateFields();
    try {
      const card = await issueGiftCard({
        initialBalance: Number(values.initialBalance),
        expiresAt: values.expiresAt?.format('YYYY-MM-DD'),
        note: values.note,
      });
      message.success(`Phát hành thẻ ${card.cardCode}`);
      setIssueOpen(false);
      issueForm.resetFields();
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Phát hành thất bại');
    }
  };

  const handleRedeem = async () => {
    const values = await redeemForm.validateFields();
    try {
      const card = await redeemGiftCard({ cardCode: values.cardCode, amount: Number(values.amount) });
      message.success(`Số dư còn: ${Number(card.currentBalance).toLocaleString('vi-VN')} đ`);
      setRedeemOpen(false);
      redeemForm.resetFields();
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Sử dụng thẻ thất bại');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Thẻ quà tặng"
        description="Phát hành và sử dụng thẻ quà tặng."
        action={
          <div className="flex gap-2">
            <Button icon={<CreditCard size={16} />} onClick={() => setRedeemOpen(true)}>Sử dụng thẻ</Button>
            <Button type="primary" icon={<Plus size={16} />} onClick={() => setIssueOpen(true)}>Phát hành</Button>
          </div>
        }
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: 'Mã thẻ', dataIndex: 'cardCode' },
          { title: 'Mệnh giá', dataIndex: 'initialBalance', render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ` },
          { title: 'Số dư', dataIndex: 'currentBalance', render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ` },
          { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag color={s === 'ACTIVE' ? 'green' : 'default'}>{s}</Tag> },
          { title: 'Hết hạn', dataIndex: 'expiresAt', render: (v?: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—') },
        ]}
      />

      <Modal open={issueOpen} title="Phát hành thẻ quà tặng" onCancel={() => setIssueOpen(false)} onOk={handleIssue}>
        <Form form={issueForm} layout="vertical">
          <Form.Item name="initialBalance" label="Mệnh giá (VND)" rules={[{ required: true }]}><InputNumber className="w-full" min={1000} /></Form.Item>
          <Form.Item name="expiresAt" label="Hết hạn"><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal open={redeemOpen} title="Sử dụng thẻ quà tặng" onCancel={() => setRedeemOpen(false)} onOk={handleRedeem}>
        <Form form={redeemForm} layout="vertical">
          <Form.Item name="cardCode" label="Mã thẻ" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="amount" label="Số tiền sử dụng" rules={[{ required: true }]}><InputNumber className="w-full" min={1} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
