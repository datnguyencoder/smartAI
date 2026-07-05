import * as React from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Table, Tabs, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { PlusCircle } from 'lucide-react';
import { Card, CardHeader , Select } from '@/components/ui';
import {
  createCashAccount,
  createFinanceTransaction,
  fetchCashAccounts,
  fetchFinanceCategories,
  fetchFinanceSummary,
  fetchFinanceTransactions,
  transferCashAccount,
} from '@/services/wmsApi';
import { formatMoney } from '@/lib/itemMapper';
import type { CashAccountDto, FinanceCategoryDto, FinanceSummaryDto, FinanceTransactionDto } from '@/types/api';

export default function FinancePage() {
  const [activeTab, setActiveTab] = React.useState('transactions');
  const [form] = Form.useForm();
  const [transferForm] = Form.useForm();
  const [accountForm] = Form.useForm();
  const [type, setType] = React.useState('ALL');
  const [rows, setRows] = React.useState<FinanceTransactionDto[]>([]);
  const [accounts, setAccounts] = React.useState<CashAccountDto[]>([]);
  const [categories, setCategories] = React.useState<FinanceCategoryDto[]>([]);
  const [summary, setSummary] = React.useState<FinanceSummaryDto>({ totalIncome: 0, totalExpense: 0, netCashFlow: 0 });
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const txType = Form.useWatch('type', form);

  const load = React.useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchFinanceTransactions(type),
      fetchFinanceSummary(),
      fetchCashAccounts(),
      fetchFinanceCategories(),
    ])
      .then(([tx, sum, accs, cats]) => {
        setRows(tx);
        setSummary(sum);
        setAccounts(accs);
        setCategories(cats);
      })
      .catch(() => message.error('Không tải được dữ liệu thu chi'))
      .finally(() => setLoading(false));
  }, [type]);

  React.useEffect(() => {
    load();
  }, [load]);

  const categoryOptions = React.useMemo(() => {
    const filtered = categories.filter((c) => c.active && (txType ? c.type === txType : true));
    return filtered.map((c) => ({ value: c.name, label: c.name }));
  }, [categories, txType]);

  const submit = async (values: any) => {
    setSaving(true);
    try {
      await createFinanceTransaction({
        ...values,
        amount: Number(values.amount),
        transactionDate: values.transactionDate.format('YYYY-MM-DD'),
      });
      message.success('Đã tạo giao dịch thu chi');
      setOpen(false);
      form.resetFields();
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể tạo giao dịch');
    } finally {
      setSaving(false);
    }
  };

  const submitTransfer = async (values: any) => {
    setSaving(true);
    try {
      await transferCashAccount({
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        amount: Number(values.amount),
        note: values.note,
      });
      message.success('Chuyển tiền thành công');
      setTransferOpen(false);
      transferForm.resetFields();
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Chuyển tiền thất bại');
    } finally {
      setSaving(false);
    }
  };

  const submitAccount = async (values: any) => {
    setSaving(true);
    try {
      await createCashAccount(values);
      message.success('Tạo tài khoản thành công');
      setAccountOpen(false);
      accountForm.resetFields();
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Tạo tài khoản thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card><div className="p-4"><p className="text-xs text-slate-500">Tổng thu</p><strong className="text-xl text-emerald-600">{formatMoney(Number(summary.totalIncome))}</strong></div></Card>
        <Card><div className="p-4"><p className="text-xs text-slate-500">Tổng chi</p><strong className="text-xl text-red-600">{formatMoney(Number(summary.totalExpense))}</strong></div></Card>
        <Card><div className="p-4"><p className="text-xs text-slate-500">Dòng tiền ròng</p><strong className="text-xl text-primary">{formatMoney(Number(summary.netCashFlow))}</strong></div></Card>
      </div>

      <Card>
        <CardHeader
          title="Thu chi cửa hàng"
          description="Ghi nhận thu nhập ngoài POS, chi phí vận hành và quản lý tài khoản tiền."
          action={
            activeTab === 'transactions' ? (
              <Button type="primary" icon={<PlusCircle size={16} />} onClick={() => setOpen(true)}>Tạo giao dịch</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setTransferOpen(true)}>Chuyển tiền</Button>
                <Button type="primary" icon={<PlusCircle size={16} />} onClick={() => setAccountOpen(true)}>Tài khoản mới</Button>
              </div>
            )
          }
        />
        <div className="px-5 pb-5">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'transactions',
                label: 'Giao dịch',
                children: (
                  <>
                    <Select className="mb-3 w-40" value={type} onChange={setType} options={[
                      { value: 'ALL', label: 'Tất cả' },
                      { value: 'INCOME', label: 'Thu' },
                      { value: 'EXPENSE', label: 'Chi' },
                    ]} />
                    <Table
                      rowKey="id"
                      loading={loading}
                      dataSource={rows}
                      columns={[
                        { title: 'Ngày', dataIndex: 'transactionDate' },
                        { title: 'Loại', dataIndex: 'type', render: (v) => <Tag color={v === 'INCOME' ? 'green' : 'red'}>{v === 'INCOME' ? 'Thu' : 'Chi'}</Tag> },
                        { title: 'Danh mục', dataIndex: 'category' },
                        { title: 'Tài khoản', dataIndex: 'paymentAccount' },
                        { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: (v) => formatMoney(Number(v)) },
                        { title: 'Ghi chú', dataIndex: 'note', render: (v) => v || '-' },
                      ]}
                    />
                  </>
                ),
              },
              {
                key: 'accounts',
                label: 'Tài khoản tiền',
                children: (
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={accounts}
                    columns={[
                      { title: 'Tên tài khoản', dataIndex: 'accountName' },
                      { title: 'Loại', dataIndex: 'accountType' },
                      { title: 'Số dư', dataIndex: 'balance', align: 'right', render: (v) => formatMoney(Number(v)) },
                      { title: 'Trạng thái', dataIndex: 'active', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Hoạt động' : 'Ngưng'}</Tag> },
                    ]}
                  />
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Modal open={open} title="Tạo giao dịch thu chi" onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saving}>
        <Form form={form} layout="vertical" onFinish={submit} initialValues={{ type: 'EXPENSE', paymentAccount: 'CASH', transactionDate: dayjs() }}>
          <Form.Item name="type" label="Loại" rules={[{ required: true }]}><Select options={[{ value: 'INCOME', label: 'Thu' }, { value: 'EXPENSE', label: 'Chi' }]} /></Form.Item>
          <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}>
            <Select
              showSearch
              placeholder="Chọn danh mục"
              options={categoryOptions}
              notFoundContent="Chưa có danh mục — nhập tên mới"
              dropdownRender={(menu: any) => (
                <>
                  {menu}
                  <div className="p-2 border-t text-xs text-slate-500">Hoặc nhập tên danh mục tùy chỉnh</div>
                </>
              )}
            />
          </Form.Item>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true, message: 'Nhập số tiền' }]}><InputNumber className="w-full" min={1} /></Form.Item>
          <Form.Item name="paymentAccount" label="Tài khoản" rules={[{ required: true }]}><Select options={[{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANK', label: 'Ngân hàng' }, { value: 'WALLET', label: 'Ví' }, { value: 'OTHER', label: 'Khác' }]} /></Form.Item>
          <Form.Item name="transactionDate" label="Ngày" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal open={transferOpen} title="Chuyển tiền giữa tài khoản" onCancel={() => setTransferOpen(false)} onOk={() => transferForm.submit()} confirmLoading={saving}>
        <Form form={transferForm} layout="vertical" onFinish={submitTransfer}>
          <Form.Item name="fromAccountId" label="Từ tài khoản" rules={[{ required: true }]}>
            <Select options={accounts.map((a) => ({ value: a.id, label: a.accountName }))} />
          </Form.Item>
          <Form.Item name="toAccountId" label="Đến tài khoản" rules={[{ required: true }]}>
            <Select options={accounts.map((a) => ({ value: a.id, label: a.accountName }))} />
          </Form.Item>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}><InputNumber className="w-full" min={1} /></Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal open={accountOpen} title="Tạo tài khoản tiền" onCancel={() => setAccountOpen(false)} onOk={() => accountForm.submit()} confirmLoading={saving}>
        <Form form={accountForm} layout="vertical" onFinish={submitAccount} initialValues={{ accountType: 'CASH' }}>
          <Form.Item name="accountName" label="Tên tài khoản" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="accountType" label="Loại" rules={[{ required: true }]}>
            <Select options={[{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANK', label: 'Ngân hàng' }, { value: 'WALLET', label: 'Ví' }]} />
          </Form.Item>
          <Form.Item name="initialBalance" label="Số dư ban đầu"><InputNumber className="w-full" min={0} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
