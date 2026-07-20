import * as React from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Table,
  Tabs,
  Tag,
  Tooltip,
  message,
} from 'antd';
import dayjs from 'dayjs';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CircleDollarSign,
  Info,
  Landmark,
  PlusCircle,
  RefreshCw,
  Tags,
  WalletCards,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '@/components/ui';
import { formatMoney } from '@/lib/itemMapper';
import {
  createCashAccount,
  createFinanceCategory,
  createFinanceTransaction,
  fetchCashAccounts,
  fetchFinanceCategories,
  fetchFinanceSummary,
  fetchFinanceTransactions,
  fetchShiftReturnedItems,
  transferCashAccount,
} from '@/services/wmsApi';
import type {
  CashAccountDto,
  FinanceCategoryDto,
  FinanceSummaryDto,
  FinanceTransactionDto,
  ProfitLossReportDto,
  ShiftReturnedItemDto,
} from '@/types/api';

const EMPTY_SUMMARY: FinanceSummaryDto = {
  salesRevenue: 0,
  refundAmount: 0,
  totalIncome: 0,
  totalExpense: 0,
  netCashFlow: 0,
  allTimeRevenue: 0,
  currentStoreMoney: 0,
};
const CHART_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#8b5cf6', '#64748b'];

type Props = {
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
  setDateRange: (range: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;
  profitLossData: ProfitLossReportDto[];
  reportLoading: boolean;
  searchText: string;
  canManage: boolean;
  onDataChanged: () => void;
};

function sumBy(rows: ProfitLossReportDto[], key: keyof ProfitLossReportDto) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function accountLabel(value: string) {
  return ({ CASH: 'Tiền mặt', BANK: 'Ngân hàng', WALLET: 'Ví điện tử', OTHER: 'Khác' } as Record<string, string>)[value] || value;
}

function MetricCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'blue' | 'red' | 'amber';
}) {
  const tones = {
    emerald: 'border-emerald-100 bg-emerald-50/60 text-emerald-700',
    blue: 'border-blue-100 bg-blue-50/60 text-blue-700',
    red: 'border-red-100 bg-red-50/60 text-red-700',
    amber: 'border-amber-100 bg-amber-50/60 text-amber-700',
  };
  return (
    <Card className="overflow-hidden">
      <div className="flex h-full items-start gap-3 p-4">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${tones[tone]}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900">{formatMoney(value)}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
    </Card>
  );
}

export function CashFlowReportTab({
  dateRange,
  setDateRange,
  profitLossData,
  reportLoading,
  searchText,
  canManage,
  onDataChanged,
}: Props) {
  const [activeSection, setActiveSection] = React.useState('overview');
  const [rows, setRows] = React.useState<FinanceTransactionDto[]>([]);
  const [accounts, setAccounts] = React.useState<CashAccountDto[]>([]);
  const [categories, setCategories] = React.useState<FinanceCategoryDto[]>([]);
  const [periodSummary, setPeriodSummary] = React.useState<FinanceSummaryDto>(EMPTY_SUMMARY);
  const [allTimeSummary, setAllTimeSummary] = React.useState<FinanceSummaryDto>(EMPTY_SUMMARY);
  const [returnedItems, setReturnedItems] = React.useState<ShiftReturnedItemDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [transactionOpen, setTransactionOpen] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState('ALL');
  const [categoryFilter, setCategoryFilter] = React.useState('ALL');
  const [transactionForm] = Form.useForm();
  const [transferForm] = Form.useForm();
  const [accountForm] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const transactionType = Form.useWatch('type', transactionForm);
  const visualLoading = loading || reportLoading;

  const formattedRange = React.useMemo(() => {
    if (!dateRange?.[0] || !dateRange?.[1]) return {};
    return {
      from: dateRange[0].format('YYYY-MM-DD'),
      to: dateRange[1].format('YYYY-MM-DD'),
    };
  }, [dateRange]);

  const loadFinance = React.useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    try {
      const [transactions, selectedSummary, lifetimeSummary, cashAccounts, financeCategories, returns] = await Promise.all([
        fetchFinanceTransactions('ALL', formattedRange.from, formattedRange.to),
        fetchFinanceSummary(formattedRange.from, formattedRange.to),
        fetchFinanceSummary(),
        fetchCashAccounts(),
        fetchFinanceCategories(),
        fetchShiftReturnedItems(),
      ]);
      setRows(transactions);
      setPeriodSummary(selectedSummary);
      setAllTimeSummary(lifetimeSummary);
      setAccounts(cashAccounts);
      setCategories(financeCategories);
      setReturnedItems(returns);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không tải được dữ liệu dòng tiền');
    } finally {
      setLoading(false);
    }
  }, [canManage, formattedRange.from, formattedRange.to]);

  React.useEffect(() => {
    loadFinance();
  }, [loadFinance]);

  const selectedRevenue = canManage ? Number(periodSummary.salesRevenue || 0) : sumBy(profitLossData, 'revenue');
  const selectedCost = sumBy(profitLossData, 'costOfGoods');
  const calculatedSelectedRefunds = returnedItems
    .filter((item) => {
      const date = dayjs(item.returnedAt);
      return (!dateRange?.[0] || !date.isBefore(dateRange[0], 'day')) && (!dateRange?.[1] || !date.isAfter(dateRange[1], 'day'));
    })
    .reduce((total, item) => total + Number(item.refundAmount || 0), 0);
  const selectedRefunds = canManage ? Number(periodSummary.refundAmount || 0) : calculatedSelectedRefunds;
  const selectedIncome = selectedRevenue - selectedRefunds + Number(periodSummary.totalIncome || 0);
  const selectedOutflow = selectedCost + Number(periodSummary.totalExpense || 0);
  const selectedNet = selectedIncome - selectedOutflow;
  const allTimeRevenue = Number(allTimeSummary.allTimeRevenue || 0);
  const currentStoreMoney = Number(allTimeSummary.currentStoreMoney || 0);
  const trackedAccountBalance = accounts.filter((account) => account.active).reduce((total, account) => total + Number(account.balance || 0), 0);

  const filteredRows = React.useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesType = typeFilter === 'ALL' || row.type === typeFilter;
      const matchesCategory = categoryFilter === 'ALL' || row.category === categoryFilter;
      const matchesSearch = !needle || row.category.toLowerCase().includes(needle) || (row.note || '').toLowerCase().includes(needle);
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [rows, typeFilter, categoryFilter, searchText]);

  const chartData = React.useMemo(() => {
    const byDate = new Map<string, { date: string; revenue: number; otherIncome: number; refunds: number; expenses: number; cost: number; net: number }>();
    profitLossData.forEach((row) => {
      byDate.set(row.date, {
        date: dayjs(row.date).format('DD/MM'),
        revenue: Number(row.revenue || 0),
        otherIncome: 0,
        refunds: 0,
        expenses: Number(row.expenses || 0),
        cost: Number(row.costOfGoods || 0),
        net: 0,
      });
    });
    rows.forEach((row) => {
      const current = byDate.get(row.transactionDate) || {
        date: dayjs(row.transactionDate).format('DD/MM'), revenue: 0, otherIncome: 0, refunds: 0, expenses: 0, cost: 0, net: 0,
      };
      // Chi phí đã có trong profitLossData; chỉ bổ sung khoản thu ngoài POS vào biểu đồ.
      if (row.type === 'INCOME') current.otherIncome += Number(row.amount || 0);
      byDate.set(row.transactionDate, current);
    });
    returnedItems.forEach((item) => {
      const key = dayjs(item.returnedAt).format('YYYY-MM-DD');
      if ((dateRange?.[0] && dayjs(key).isBefore(dateRange[0], 'day')) || (dateRange?.[1] && dayjs(key).isAfter(dateRange[1], 'day'))) return;
      const current = byDate.get(key) || {
        date: dayjs(key).format('DD/MM'), revenue: 0, otherIncome: 0, refunds: 0, expenses: 0, cost: 0, net: 0,
      };
      current.refunds += Number(item.refundAmount || 0);
      byDate.set(key, current);
    });
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, row]) => ({ ...row, net: row.revenue + row.otherIncome - row.refunds - row.expenses - row.cost }));
  }, [profitLossData, rows, returnedItems, dateRange]);

  const expenseCategories = React.useMemo(() => {
    const grouped = new Map<string, number>();
    if (selectedCost > 0) grouped.set('Giá vốn hàng bán', selectedCost);
    if (selectedRefunds > 0) grouped.set('Hoàn tiền khách hàng', selectedRefunds);
    rows.filter((row) => row.type === 'EXPENSE').forEach((row) => {
      grouped.set(row.category, (grouped.get(row.category) || 0) + Number(row.amount || 0));
    });
    return Array.from(grouped, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rows, selectedCost, selectedRefunds]);

  const activeCategoryOptions = React.useMemo(
    () => categories.filter((category) => category.active && (!transactionType || category.type === transactionType)),
    [categories, transactionType],
  );

  const submitTransaction = async (values: any) => {
    setSaving(true);
    try {
      const category = categories.find((item) => item.id === values.categoryId);
      await createFinanceTransaction({
        type: values.type,
        categoryId: values.categoryId,
        category: category?.name || '',
        cashAccountId: values.cashAccountId,
        amount: Number(values.amount),
        paymentAccount: values.paymentAccount,
        transactionDate: values.transactionDate.format('YYYY-MM-DD'),
        note: values.note,
      });
      message.success('Đã ghi nhận giao dịch dòng tiền');
      setTransactionOpen(false);
      transactionForm.resetFields();
      await loadFinance();
      onDataChanged();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể tạo giao dịch');
    } finally {
      setSaving(false);
    }
  };

  const submitTransfer = async (values: any) => {
    setSaving(true);
    try {
      await transferCashAccount({ ...values, amount: Number(values.amount) });
      message.success('Chuyển tiền thành công');
      setTransferOpen(false);
      transferForm.resetFields();
      await loadFinance();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Chuyển tiền thất bại');
    } finally {
      setSaving(false);
    }
  };

  const submitAccount = async (values: any) => {
    setSaving(true);
    try {
      await createCashAccount({ ...values, initialBalance: Number(values.initialBalance || 0) });
      message.success('Đã tạo tài khoản tiền');
      setAccountOpen(false);
      accountForm.resetFields();
      await loadFinance();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể tạo tài khoản');
    } finally {
      setSaving(false);
    }
  };

  const submitCategory = async (values: any) => {
    setSaving(true);
    try {
      await createFinanceCategory(values);
      message.success('Đã thêm danh mục dòng tiền');
      setCategoryOpen(false);
      categoryForm.resetFields();
      setCategories(await fetchFinanceCategories());
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể tạo danh mục');
    } finally {
      setSaving(false);
    }
  };

  const setQuickRange = (days: number | 'month') => {
    const end = dayjs();
    const start = days === 'month' ? end.startOf('month') : end.subtract(days - 1, 'day');
    setDateRange([start, end]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div>
          <p className="font-semibold text-slate-900">Tổng quan dòng tiền</p>
          <p className="text-xs text-slate-500">Doanh thu POS, thu chi ngoài POS và chi phí trong cùng một nơi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-slate-500">Chọn nhanh:</span>
          <Button size="small" onClick={() => setQuickRange(1)}>Hôm nay</Button>
          <Button size="small" onClick={() => setQuickRange(7)}>7 ngày</Button>
          <Button size="small" onClick={() => setQuickRange(30)}>30 ngày</Button>
          <Button size="small" onClick={() => setQuickRange('month')}>Tháng này</Button>
          {canManage && <Button size="small" icon={<RefreshCw size={14} />} onClick={loadFinance} loading={loading}>Làm mới</Button>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Tiền cửa hàng hiện tại"
          value={currentStoreMoney}
          description="Tiền bán hàng sau hoàn trả + thu chi khác toàn thời gian."
          icon={<WalletCards size={20} />}
          tone="emerald"
        />
        <MetricCard
          title="Doanh thu toàn thời gian"
          value={allTimeRevenue}
          description="Tổng tiền bán hàng đã thu, đã trừ hoàn trả."
          icon={<CircleDollarSign size={20} />}
          tone="blue"
        />
        <MetricCard
          title="Tiền vào trong kỳ"
          value={selectedIncome}
          description={`Bán hàng ${formatMoney(selectedRevenue)} − hoàn trả ${formatMoney(selectedRefunds)} + thu khác ${formatMoney(Number(periodSummary.totalIncome || 0))}.`}
          icon={<ArrowUpCircle size={20} />}
          tone="emerald"
        />
        <MetricCard
          title="Tiền ra & giá vốn"
          value={selectedOutflow}
          description={`Giá vốn ${formatMoney(selectedCost)} + chi khác ${formatMoney(Number(periodSummary.totalExpense || 0))}.`}
          icon={<ArrowDownCircle size={20} />}
          tone="red"
        />
      </div>

      <div className={`rounded-2xl border px-5 py-4 ${selectedNet >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-700">Kết quả thực trong kỳ</p>
              <Tooltip title="Doanh thu bán hàng + thu khác − giá vốn − chi khác">
                <Info size={14} className="cursor-help text-slate-400" />
              </Tooltip>
            </div>
            <p className="mt-1 text-xs text-slate-500">Khoảng thời gian đang chọn ở bộ lọc báo cáo.</p>
          </div>
          <strong className={`text-3xl ${selectedNet >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatMoney(selectedNet)}</strong>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold text-slate-900">Tiền vào và tiền ra theo thời gian</h3>
            <p className="mt-1 text-xs text-slate-500">So sánh doanh thu, thu khác, giá vốn, chi phí và kết quả ròng.</p>
          </div>
          <div className="h-[330px] px-3 py-4">
            {chartData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-slate-400">Chưa có dữ liệu trong khoảng thời gian này</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 18, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke="#eef2f7" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}tr`} />
                  <ChartTooltip formatter={(value: number, name: string) => [formatMoney(Number(value)), name]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="otherIncome" name="Thu khác" fill="#38bdf8" radius={[5, 5, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="refunds" name="Hoàn tiền" fill="#fb7185" radius={[5, 5, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="cost" name="Giá vốn" fill="#f59e0b" radius={[5, 5, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="expenses" name="Chi khác" fill="#ef4444" radius={[5, 5, 0, 0]} maxBarSize={24} />
                  <Line type="monotone" dataKey="net" name="Kết quả ròng" stroke="#4f46e5" strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold text-slate-900">Tiền đã đi đâu?</h3>
            <p className="mt-1 text-xs text-slate-500">Cơ cấu giá vốn và các danh mục chi trong kỳ.</p>
          </div>
          <div className="h-[265px] px-3 py-3">
            {expenseCategories.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-slate-400">Chưa có khoản chi</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseCategories} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={2}>
                    {expenseCategories.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <ChartTooltip formatter={(value: number) => formatMoney(Number(value))} />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mx-4 mb-4 rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Số dư tài khoản theo dõi</span>
              <strong className="text-slate-900">{formatMoney(trackedAccountBalance)}</strong>
            </div>
          </div>
        </Card>
      </div>

      {canManage ? (
        <Card>
          <Tabs
            activeKey={activeSection}
            onChange={setActiveSection}
            tabBarExtraContent={activeSection === 'transactions' ? (
              <div className="flex gap-2">
                <Button icon={<Tags size={15} />} onClick={() => setCategoryOpen(true)}>Danh mục</Button>
                <Button type="primary" icon={<PlusCircle size={15} />} onClick={() => setTransactionOpen(true)}>Tạo giao dịch</Button>
              </div>
            ) : activeSection === 'accounts' ? (
              <div className="flex gap-2">
                <Button onClick={() => setTransferOpen(true)}>Chuyển tiền</Button>
                <Button type="primary" icon={<PlusCircle size={15} />} onClick={() => setAccountOpen(true)}>Tài khoản mới</Button>
              </div>
            ) : null}
            className="px-5 pb-5"
            items={[
              {
                key: 'overview',
                label: 'Giải thích số liệu',
                children: (
                  <div className="grid gap-3 py-2 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <Banknote size={20} className="text-emerald-600" />
                      <p className="mt-3 font-semibold text-slate-900">Tiền bán hàng</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">Lấy từ các hóa đơn POS hoàn tất, sau khi trừ tiền hoàn trả.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <ArrowUpCircle size={20} className="text-blue-600" />
                      <p className="mt-3 font-semibold text-slate-900">Thu và chi khác</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">Các khoản ngoài POS như thu phụ, điện nước, lương, thuê mặt bằng.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <Landmark size={20} className="text-violet-600" />
                      <p className="mt-3 font-semibold text-slate-900">Tài khoản tiền</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">Theo dõi tiền mặt, ngân hàng và ví; chuyển tiền không làm thay đổi tổng tiền.</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'transactions',
                label: 'Giao dịch thu chi',
                children: (
                  <>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <Segmented
                        value={typeFilter}
                        onChange={(value) => setTypeFilter(String(value))}
                        options={[
                          { value: 'ALL', label: 'Tất cả' },
                          { value: 'INCOME', label: 'Tiền vào' },
                          { value: 'EXPENSE', label: 'Tiền ra' },
                        ]}
                      />
                      <Select
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        showSearch
                        optionFilterProp="label"
                        className="min-w-[220px]"
                        options={[
                          { value: 'ALL', label: 'Tất cả danh mục' },
                          ...categories.filter((category) => category.active).map((category) => ({ value: category.name, label: category.name })),
                        ]}
                      />
                    </div>
                    <Table
                      rowKey="id"
                      loading={visualLoading}
                      dataSource={filteredRows}
                      scroll={{ x: 900 }}
                      locale={{ emptyText: 'Chưa có giao dịch thu chi trong kỳ này' }}
                      columns={[
                        { title: 'Ngày', dataIndex: 'transactionDate', width: 115, render: (value: string) => dayjs(value).format('DD/MM/YYYY') },
                        { title: 'Dòng tiền', dataIndex: 'type', width: 110, render: (value: string) => <Tag color={value === 'INCOME' ? 'green' : 'red'}>{value === 'INCOME' ? 'Tiền vào' : 'Tiền ra'}</Tag> },
                        { title: 'Danh mục', dataIndex: 'category', width: 180 },
                        { title: 'Tài khoản', dataIndex: 'paymentAccount', width: 130, render: accountLabel },
                        { title: 'Số tiền', dataIndex: 'amount', align: 'right' as const, width: 150, render: (value: number, row: FinanceTransactionDto) => <strong className={row.type === 'INCOME' ? 'text-emerald-700' : 'text-red-700'}>{row.type === 'INCOME' ? '+' : '−'}{formatMoney(Number(value))}</strong> },
                        { title: 'Ghi chú', dataIndex: 'note', render: (value?: string) => value || '—' },
                      ]}
                      pagination={{ pageSize: 10, showSizeChanger: false }}
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
                    loading={visualLoading}
                    dataSource={accounts}
                    locale={{ emptyText: 'Chưa có tài khoản tiền' }}
                    columns={[
                      { title: 'Tên tài khoản', dataIndex: 'accountName' },
                      { title: 'Loại', dataIndex: 'accountType', render: accountLabel },
                      { title: 'Số dư', dataIndex: 'balance', align: 'right' as const, render: (value: number) => <strong>{formatMoney(Number(value))}</strong> },
                      { title: 'Trạng thái', dataIndex: 'active', render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? 'Hoạt động' : 'Ngưng'}</Tag> },
                    ]}
                  />
                ),
              },
            ]}
          />
        </Card>
      ) : (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Bạn đang xem báo cáo tổng hợp. Chỉ Quản trị viên và Quản lý được tạo giao dịch hoặc quản lý tài khoản tiền.
        </div>
      )}

      <Modal open={transactionOpen} title="Tạo giao dịch dòng tiền" onCancel={() => setTransactionOpen(false)} onOk={() => transactionForm.submit()} confirmLoading={saving} okText="Lưu giao dịch">
        <Form form={transactionForm} layout="vertical" onFinish={submitTransaction} initialValues={{ type: 'EXPENSE', paymentAccount: 'CASH', transactionDate: dayjs() }}>
          <Form.Item name="type" label="Tiền vào hay tiền ra?" rules={[{ required: true }]}>
            <Segmented block options={[{ value: 'INCOME', label: 'Tiền vào' }, { value: 'EXPENSE', label: 'Tiền ra' }]} />
          </Form.Item>
          <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}>
            <Select showSearch optionFilterProp="label" placeholder="Chọn danh mục" options={activeCategoryOptions.map((category) => ({ value: category.id, label: category.name }))} />
          </Form.Item>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true, message: 'Nhập số tiền' }]}><InputNumber className="w-full" min={1} formatter={(value) => Number(value || 0).toLocaleString('vi-VN')} /></Form.Item>
          <Form.Item name="paymentAccount" label="Hình thức tiền" rules={[{ required: true }]}>
            <Select options={[{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANK', label: 'Ngân hàng' }, { value: 'WALLET', label: 'Ví điện tử' }, { value: 'OTHER', label: 'Khác' }]} />
          </Form.Item>
          <Form.Item name="cashAccountId" label="Tài khoản theo dõi (không bắt buộc)">
            <Select allowClear placeholder="Không gắn tài khoản" options={accounts.filter((account) => account.active).map((account) => ({ value: account.id, label: `${account.accountName} · ${formatMoney(Number(account.balance))}` }))} />
          </Form.Item>
          <Form.Item name="transactionDate" label="Ngày phát sinh" rules={[{ required: true }]}><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={3} placeholder="Mô tả ngắn khoản thu hoặc chi" /></Form.Item>
        </Form>
      </Modal>

      <Modal open={categoryOpen} title="Thêm danh mục dòng tiền" onCancel={() => setCategoryOpen(false)} onOk={() => categoryForm.submit()} confirmLoading={saving} okText="Thêm danh mục">
        <Form form={categoryForm} layout="vertical" onFinish={submitCategory} initialValues={{ type: 'EXPENSE' }}>
          <Form.Item name="type" label="Loại danh mục" rules={[{ required: true }]}><Segmented block options={[{ value: 'INCOME', label: 'Tiền vào' }, { value: 'EXPENSE', label: 'Tiền ra' }]} /></Form.Item>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Nhập tên danh mục' }]}><Input placeholder="Ví dụ: Điện nước, thuê mặt bằng" /></Form.Item>
        </Form>
      </Modal>

      <Modal open={transferOpen} title="Chuyển tiền giữa tài khoản" onCancel={() => setTransferOpen(false)} onOk={() => transferForm.submit()} confirmLoading={saving} okText="Chuyển tiền">
        <Form form={transferForm} layout="vertical" onFinish={submitTransfer}>
          <Form.Item name="fromAccountId" label="Từ tài khoản" rules={[{ required: true }]}><Select options={accounts.filter((account) => account.active).map((account) => ({ value: account.id, label: account.accountName }))} /></Form.Item>
          <Form.Item name="toAccountId" label="Đến tài khoản" rules={[{ required: true }]}><Select options={accounts.filter((account) => account.active).map((account) => ({ value: account.id, label: account.accountName }))} /></Form.Item>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}><InputNumber className="w-full" min={1} /></Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal open={accountOpen} title="Tạo tài khoản tiền" onCancel={() => setAccountOpen(false)} onOk={() => accountForm.submit()} confirmLoading={saving} okText="Tạo tài khoản">
        <Form form={accountForm} layout="vertical" onFinish={submitAccount} initialValues={{ accountType: 'CASH', initialBalance: 0 }}>
          <Form.Item name="accountName" label="Tên tài khoản" rules={[{ required: true }]}><Input placeholder="Ví dụ: Két tiền cửa hàng" /></Form.Item>
          <Form.Item name="accountType" label="Loại tài khoản" rules={[{ required: true }]}><Select options={[{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANK', label: 'Ngân hàng' }, { value: 'WALLET', label: 'Ví điện tử' }]} /></Form.Item>
          <Form.Item name="initialBalance" label="Số dư ban đầu"><InputNumber className="w-full" min={0} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
