import * as React from 'react';
import { Button, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd';
import { WalletCards } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { fetchCustomerDebts, recordCustomerDebtPayment } from '@/services/wmsApi';
import { formatMoney } from '@/lib/itemMapper';
import { PAYMENT_LABEL } from '@/lib/constants/paymentLabels';
import type { CustomerDebtDto } from '@/types/api';

const statusLabel: Record<string, string> = {
  UNPAID: 'Chưa thu',
  PARTIAL: 'Thu một phần',
  OVERDUE: 'Quá hạn',
  PAID: 'Đã thu',
};

const statusColor: Record<string, string> = {
  UNPAID: 'orange',
  PARTIAL: 'blue',
  OVERDUE: 'red',
  PAID: 'green',
};

export default function CustomerDebtsPage() {
  const [debts, setDebts] = React.useState<CustomerDebtDto[]>([]);
  const [status, setStatus] = React.useState('ALL');
  const [loading, setLoading] = React.useState(false);
  const [payingDebt, setPayingDebt] = React.useState<CustomerDebtDto | null>(null);
  const [paymentAmount, setPaymentAmount] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState('CASH');
  const [saving, setSaving] = React.useState(false);

  const loadDebts = React.useCallback(() => {
    setLoading(true);
    fetchCustomerDebts(status)
      .then(setDebts)
      .catch(() => {
        setDebts([]);
        message.error('Không tải được công nợ khách');
      })
      .finally(() => setLoading(false));
  }, [status]);

  React.useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const openPayment = (debt: CustomerDebtDto) => {
    setPayingDebt(debt);
    setPaymentAmount(Number(debt.remainingAmount || 0));
    setPaymentMethod('CASH');
  };

  const submitPayment = async () => {
    if (!payingDebt) return;
    if (paymentAmount <= 0 || paymentAmount > Number(payingDebt.remainingAmount)) {
      message.error('Số tiền thu không hợp lệ');
      return;
    }
    setSaving(true);
    try {
      await recordCustomerDebtPayment(payingDebt.id, {
        amount: paymentAmount,
        paymentMethod,
        note: 'Thu công nợ khách tại quầy',
      });
      message.success('Đã ghi nhận thu tiền');
      setPayingDebt(null);
      loadDebts();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể thu công nợ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Công nợ khách hàng"
        description="Theo dõi đơn POS ghi nợ và thu tiền từng phần."
        action={
          <Select
            className="w-40"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'ALL', label: 'Tất cả' },
              { value: 'UNPAID', label: 'Chưa thu' },
              { value: 'PARTIAL', label: 'Thu một phần' },
              { value: 'OVERDUE', label: 'Quá hạn' },
              { value: 'PAID', label: 'Đã thu' },
            ]}
          />
        }
      />
      <div className="px-5 pb-5">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={debts}
          columns={[
            {
              title: 'Khách hàng',
              dataIndex: 'customerName',
              render: (value, row) => (
                <div>
                  <div className="font-semibold text-ink">{value}</div>
                  <div className="text-xs text-slate-400">{row.customerPhone || '-'}</div>
                </div>
              ),
            },
            { title: 'Hóa đơn', dataIndex: 'orderCode' },
            { title: 'Ngày hẹn', dataIndex: 'dueDate', render: (value) => value || '-' },
            { title: 'Tổng nợ', dataIndex: 'amount', align: 'right', render: (value) => formatMoney(Number(value)) },
            { title: 'Đã thu', dataIndex: 'paidAmount', align: 'right', render: (value) => formatMoney(Number(value)) },
            { title: 'Còn lại', dataIndex: 'remainingAmount', align: 'right', render: (value) => <strong>{formatMoney(Number(value))}</strong> },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              render: (value) => <Tag color={statusColor[value] || 'default'}>{statusLabel[value] || value}</Tag>,
            },
            {
              title: '',
              align: 'right',
              render: (_, row) => (
                <Button
                  icon={<WalletCards size={16} />}
                  disabled={row.status === 'PAID'}
                  onClick={() => openPayment(row)}
                >
                  Thu tiền
                </Button>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={!!payingDebt}
        title="Thu công nợ khách"
        onCancel={() => setPayingDebt(null)}
        onOk={submitPayment}
        confirmLoading={saving}
        okText="Ghi nhận"
        cancelText="Đóng"
      >
        {payingDebt && (
          <Space direction="vertical" className="w-full" size="middle">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-ink">{payingDebt.customerName}</div>
              <div className="text-slate-500">{payingDebt.orderCode} · Còn {formatMoney(Number(payingDebt.remainingAmount))}</div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Số tiền thu</label>
              <InputNumber className="w-full" min={1} max={Number(payingDebt.remainingAmount)} value={paymentAmount} onChange={(v) => setPaymentAmount(Number(v) || 0)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Phương thức</label>
              <Select
                className="w-full"
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={['CASH', 'BANK_TRANSFER', 'CARD', 'WALLET'].map((value) => ({
                  value,
                  label: PAYMENT_LABEL[value] || value,
                }))}
              />
            </div>
          </Space>
        )}
      </Modal>
    </Card>
  );
}
