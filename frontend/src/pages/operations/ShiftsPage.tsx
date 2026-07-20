import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Col, Descriptions, Input, message, Modal, Row, Space, Statistic, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { Card, CardHeader } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney } from '@/lib/itemMapper';
import { normalizeRole } from '@/lib/permissions';
import {
  approveShift,
  closeShift,
  fetchCurrentShift,
  fetchShiftActivity,
  fetchShiftBillFlow,
  fetchShiftDashboard,
  fetchShiftReturnedItems,
  fetchShiftSummary,
  fetchShifts,
  openShift,
  requestManagerShiftUpdate,
  requestStaffShiftUpdate,
  submitManagerShiftReview,
  updateStaffShiftExplanation,
} from '@/services/shiftApi';
import type { AuditLogDto, ShiftBillFlowDto, ShiftDashboardDto, ShiftDto, ShiftReturnedItemDto, ShiftSummaryDto } from '@/types/api';

type ActionType = 'staff-update' | 'staff-explanation' | 'manager-review' | 'manager-update' | 'approve';

const OPENING_FUND = 1_000_000;

export default function ShiftsPage() {
  const { authUser } = useAuth();
  const role = normalizeRole(authUser?.role);
  const management = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';
  const [dashboard, setDashboard] = useState<ShiftDashboardDto | null>(null);
  const [shifts, setShifts] = useState<ShiftDto[]>([]);
  const [current, setCurrent] = useState<ShiftDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [closeMatches, setCloseMatches] = useState(true);
  const [closePreview, setClosePreview] = useState<ShiftSummaryDto | null>(null);
  const [openingNote, setOpeningNote] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [explanation, setExplanation] = useState('');
  const [summary, setSummary] = useState<ShiftSummaryDto | null>(null);
  const [billFlow, setBillFlow] = useState<ShiftBillFlowDto[]>([]);
  const [returnedItems, setReturnedItems] = useState<ShiftReturnedItemDto[]>([]);
  const [auditHistory, setAuditHistory] = useState<AuditLogDto[]>([]);
  const [action, setAction] = useState<{ shift: ShiftDto; type: ActionType } | null>(null);
  const [actionNote, setActionNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [active, list, board, returns] = await Promise.all([
        fetchCurrentShift(),
        fetchShifts(),
        fetchShiftDashboard(),
        fetchShiftReturnedItems(),
      ]);
      setCurrent(active);
      setShifts(list);
      setDashboard(board);
      setReturnedItems(returns);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không tải được ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleOpen = async () => {
    if (!openingNote.trim()) {
      message.warning('Vui lòng nhập ghi chú mở ca');
      return;
    }
    try {
      await openShift(openingNote.trim());
      setOpenModal(false);
      message.success('Mở ca thành công');
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Mở ca thất bại');
    }
  };

  const openCloseModal = async () => {
    if (!current) return;
    setCloseMatches(true);
    setExplanation('');
    setClosingNote('');
    setClosePreview(null);
    setCloseModal(true);
    try {
      setClosePreview(await fetchShiftSummary(current.id));
    } catch {
      // Preview is guidance only; closing still lets backend calculate.
    }
  };

  const handleClose = async () => {
    if (!current) return;
    if (!closingNote.trim()) {
      message.warning('Vui lòng nhập ghi chú đóng ca');
      return;
    }
    if (!closeMatches && !explanation.trim()) {
      message.warning('Vui lòng nhập giải trình khi báo không khớp');
      return;
    }
    try {
      await closeShift(current.id, closeMatches, closingNote.trim(), closeMatches ? undefined : explanation.trim());
      setCloseModal(false);
      message.success('Đã đóng và gửi ca cho quản lý');
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Đóng ca thất bại');
    }
  };

  const handleSummary = async (shift: ShiftDto) => {
    try {
      const [nextSummary, history, bills] = await Promise.all([
        fetchShiftSummary(shift.id),
        fetchShiftActivity(shift.id),
        fetchShiftBillFlow(shift.id),
      ]);
      setSummary(nextSummary);
      setAuditHistory(history.content);
      setBillFlow(bills);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không tải được tổng kết ca');
    }
  };

  const openAction = (shift: ShiftDto, type: ActionType) => {
    setAction({ shift, type });
    setActionNote('');
  };

  const runAction = async () => {
    if (!action || !actionNote.trim()) return;
    const handlers: Record<ActionType, (id: number, note: string) => Promise<ShiftDto>> = {
      'staff-update': requestStaffShiftUpdate,
      'staff-explanation': updateStaffShiftExplanation,
      'manager-review': submitManagerShiftReview,
      'manager-update': requestManagerShiftUpdate,
      approve: approveShift,
    };
    try {
      await handlers[action.type](action.shift.id, actionNote.trim());
      setAction(null);
      message.success('Đã cập nhật ca làm việc');
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Cập nhật ca thất bại');
    }
  };

  const statusTag = (status: ShiftDto['status']) => {
    const values: Record<ShiftDto['status'], [string, string]> = {
      OPEN: ['green', 'Đang mở'],
      PENDING_REVIEW: ['orange', 'Chờ quản lý'],
      NEEDS_STAFF_UPDATE: ['gold', 'Cần nhân viên giải trình'],
      REVIEWED_BY_MANAGER: ['blue', 'Chờ Admin'],
      NEEDS_MANAGER_UPDATE: ['purple', 'Cần quản lý kiểm tra'],
      APPROVED: ['green', 'Đã duyệt'],
      REJECTED: ['red', 'Từ chối (cũ)'],
      CLOSED: ['default', 'Đã đóng (cũ)'],
    };
    return <Tag color={values[status][0]}>{values[status][1]}</Tag>;
  };

  const columns = [
    { title: 'Mã ca', dataIndex: 'id', render: (id: number) => `#${id}` },
    { title: 'Nhân viên', dataIndex: 'cashierName' },
    { title: 'Mở ca', dataIndex: 'openedAt', render: (value: string) => dayjs(value).format('DD/MM HH:mm') },
    { title: 'Đóng ca', dataIndex: 'closedAt', render: (value?: string) => value ? dayjs(value).format('DD/MM HH:mm') : '—' },
    { title: 'Tiền mặt trong két cuối ca', dataIndex: 'closingCash', render: (value?: number) => value != null ? formatMoney(value) : '—' },
    { title: 'Số đơn', dataIndex: 'totalOrders' },
    { title: 'Khớp', dataIndex: 'staffMismatchReported', render: (value?: boolean) => value ? <Tag color="red">Không</Tag> : <Tag color="green">Có</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
    {
      title: 'Thao tác', render: (_: unknown, shift: ShiftDto) => <Space wrap>
        <Button size="small" onClick={() => void handleSummary(shift)}>Chi tiết</Button>
        {management && shift.status === 'PENDING_REVIEW' && <>
          <Button size="small" onClick={() => openAction(shift, 'staff-update')}>Trả nhân viên</Button>
          <Button size="small" type="primary" onClick={() => openAction(shift, 'manager-review')}>Gửi Admin</Button>
        </>}
        {shift.status === 'NEEDS_STAFF_UPDATE' && !management &&
          <Button size="small" type="primary" onClick={() => openAction(shift, 'staff-explanation')}>Bổ sung</Button>}
        {management && shift.status === 'NEEDS_MANAGER_UPDATE' &&
          <Button size="small" type="primary" onClick={() => openAction(shift, 'manager-review')}>Gửi lại Admin</Button>}
        {role === 'ROLE_ADMIN' && shift.status === 'REVIEWED_BY_MANAGER' && <>
          <Button size="small" onClick={() => openAction(shift, 'manager-update')}>Trả quản lý</Button>
          <Button size="small" type="primary" onClick={() => openAction(shift, 'approve')}>Phê duyệt</Button>
        </>}
      </Space>,
    },
  ];

  const paymentMethodLabel = (value?: string) => {
    if (!value) return '—';
    const labels: Record<string, string> = {
      CASH: 'Tiền mặt',
      BANK_TRANSFER: 'Chuyển khoản',
      CARD: 'Thẻ',
      WALLET: 'Ví điện tử',
      PAY_LATER: 'Trả sau',
    };
    return value.split(', ').map((method) => labels[method] ?? method).join(' + ');
  };

  return <Card>
    <CardHeader title="Ca làm việc" description="Theo dõi tiền két, dòng tiền, đối soát và lịch sử chung trong một màn hình" action={
      current
        ? <Button danger type="primary" onClick={() => { void openCloseModal(); }}>Đóng ca</Button>
        : <Button type="primary" onClick={() => { setOpeningNote(''); setOpenModal(true); }}>Mở ca</Button>
    } />

    <div className="px-5 pb-5 space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}><Statistic title="Tổng tiền hiện có của cửa hàng" value={formatMoney(dashboard?.currentStoreMoney ?? 0)} /></Col>
          <Col xs={24} md={6}><Statistic title="Tiền mặt trong két hiện tại" value={formatMoney(dashboard?.currentCashDrawerAmount ?? 0)} /></Col>
          <Col xs={24} md={6}><Statistic title="Tổng tiền mặt đã thu" value={formatMoney(dashboard?.totalCashCollected ?? 0)} /></Col>
          <Col xs={24} md={6}><Statistic title="Thanh toán không tiền mặt" value={formatMoney(dashboard?.totalNonCashCollected ?? 0)} /></Col>
          <Col xs={24} md={6}><Statistic title="Số ca đang mở" value={dashboard?.activeShiftCount ?? 0} /></Col>
          <Col xs={24} md={6}><Statistic title="Số ca chờ Manager" value={dashboard?.pendingManagerCount ?? 0} /></Col>
          <Col xs={24} md={6}><Statistic title="Số ca chờ Admin" value={dashboard?.pendingAdminCount ?? 0} /></Col>
        </Row>
      </div>

      {current ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}><Statistic title="Ca đang mở" value={`#${current.id}`} /></Col>
          <Col xs={24} md={6}><Statistic title="Nhân viên" value={current.cashierName || '—'} /></Col>
          <Col xs={24} md={6}><Statistic title="Mở lúc" value={dayjs(current.openedAt).format('DD/MM HH:mm')} /></Col>
          <Col xs={24} md={6}><Statistic title="Tiền quỹ đầu ca" value={formatMoney(current.openingCash ?? OPENING_FUND)} /></Col>
        </Row>
      </div> : <div className="rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
        Hiện không có ca đang mở.
      </div>}

      <div>
        <h3 className="mb-1 font-semibold">Hàng đã trả theo ca</h3>
        <p className="mb-2 text-sm text-slate-500">Mỗi dòng cho biết mặt hàng nào đã được trả và thuộc ca bán hàng nào.</p>
        <Table
          size="small"
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          rowKey="returnItemId"
          dataSource={returnedItems}
          locale={{ emptyText: 'Chưa có mặt hàng nào được trả' }}
          columns={[
            { title: 'Ca', dataIndex: 'shiftId', render: (id: number) => <strong>#{id}</strong> },
            { title: 'Phiếu trả', dataIndex: 'returnOrderId', render: (id: number) => `#${id}` },
            { title: 'Đơn gốc', dataIndex: 'originalOrderCode' },
            { title: 'Mặt hàng', dataIndex: 'itemName' },
            { title: 'Số lượng trả', dataIndex: 'quantity' },
            { title: 'Tiền hoàn', dataIndex: 'refundAmount', render: (value: number) => <span className="text-red-600">{formatMoney(value)}</span> },
            { title: 'Phương thức', dataIndex: 'paymentMethods', render: paymentMethodLabel },
            { title: 'Thời gian trả', dataIndex: 'returnedAt', render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm') },
          ]}
          scroll={{ x: 900 }}
        />
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Thống kê tất cả ca</h3>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}><Statistic title="Tổng số ca" value={dashboard?.statistics.totalShifts ?? 0} /></Col>
          <Col xs={24} md={6}><Statistic title="Tổng đơn hoàn thành" value={dashboard?.statistics.totalCompletedOrders ?? 0} /></Col>
          <Col xs={24} md={6}><Statistic title="Tổng đơn bị hủy" value={dashboard?.statistics.totalCancelledOrders ?? 0} /></Col>
          <Col xs={24} md={6}><Statistic title="Tổng tiền hiện có" value={formatMoney(dashboard?.statistics.currentStoreMoney ?? 0)} /></Col>
        </Row>
      </div>

      {!management && <p className="mb-3 text-xs text-slate-500">Bạn chỉ xem được lịch sử ca của chính mình.</p>}
      <Table rowKey="id" loading={loading} dataSource={shifts} columns={columns} scroll={{ x: 1100 }} />
    </div>

    <Modal title="Mở ca làm việc" open={openModal} onCancel={() => setOpenModal(false)} onOk={handleOpen}>
      <p className="mb-3">Tiền quỹ đầu ca cố định: <strong>{formatMoney(OPENING_FUND)}</strong>. Nhân viên không nhập hay sửa số tiền này.</p>
      <Input.TextArea rows={3} value={openingNote} onChange={(event) => setOpeningNote(event.target.value)}
        placeholder="Ghi chú mở ca (bắt buộc)" />
    </Modal>

    <Modal title="Đóng ca làm việc" open={closeModal} onCancel={() => setCloseModal(false)} onOk={handleClose}>
      {closePreview ? (
        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
          <div className="flex justify-between"><span>Tiền quỹ đầu ca</span><span className="font-medium">{formatMoney(closePreview.openingCash)}</span></div>
          <div className="flex justify-between"><span>+ Tiền mặt thu trong ca</span><span className="font-medium text-emerald-700">+{formatMoney(closePreview.cashSales)}</span></div>
          <div className="flex justify-between"><span>− Tiền hoàn bằng tiền mặt</span><span className="font-medium text-red-600">−{formatMoney(closePreview.cashRefundAmount)}</span></div>
          <div className="flex justify-between border-t border-slate-300 pt-1 font-bold">
            <span>= Tiền mặt trong két cuối ca</span>
            <span className="text-blue-700">{formatMoney(closePreview.cashDrawerEndingAmount ?? closePreview.expectedCash ?? 0)}</span>
          </div>
        </div>
      ) : <p className="mb-2 text-sm text-slate-500">Đang tính tiền mặt trong két cuối ca...</p>}
      <Checkbox checked={closeMatches} onChange={(event) => setCloseMatches(event.target.checked)}>
        Tôi xác nhận số liệu hệ thống khớp với thực tế
      </Checkbox>
      <Input.TextArea className="mt-4" rows={3} value={closingNote}
        onChange={(event) => setClosingNote(event.target.value)} placeholder="Ghi chú đóng ca (bắt buộc)" />
      {!closeMatches && <Input.TextArea className="mt-4" rows={4} value={explanation}
        onChange={(event) => setExplanation(event.target.value)}
        placeholder="Giải trình không khớp (bắt buộc)" />}
    </Modal>

    <Modal title="Ghi chú/lý do xử lý" open={!!action} onCancel={() => setAction(null)} onOk={runAction}
      okButtonProps={{ disabled: !actionNote.trim() }}>
      <Input.TextArea rows={4} value={actionNote} onChange={(event) => setActionNote(event.target.value)}
        placeholder="Nội dung bắt buộc và sẽ được lưu vào lịch sử kiểm toán" />
    </Modal>

    <Modal title={`Chi tiết ca #${summary?.shiftId ?? ''}`} open={!!summary} onCancel={() => setSummary(null)} footer={null} width={980}>
      {summary && <>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Nhân viên">{summary.cashierName}</Descriptions.Item>
          <Descriptions.Item label="Thời gian">{dayjs(summary.openedAt).format('DD/MM/YYYY HH:mm')} → {summary.closedAt ? dayjs(summary.closedAt).format('DD/MM/YYYY HH:mm') : 'đang mở'}</Descriptions.Item>
          <Descriptions.Item label="Đơn hoàn tất / hủy / trả">{summary.completedOrders} / {summary.cancelledOrders} / {summary.refundedOrders}</Descriptions.Item>
        </Descriptions>

        <div className="mt-5">
          <h3 className="mb-2 font-semibold">Tiền đã thanh toán theo phương thức</h3>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={8}><Statistic title="Tiền mặt" value={formatMoney(summary.cashSales)} /></Col>
            <Col xs={24} sm={12} md={8}><Statistic title="Chuyển khoản" value={formatMoney(summary.bankSales)} /></Col>
            <Col xs={24} sm={12} md={8}><Statistic title="Thẻ" value={formatMoney(summary.cardSales)} /></Col>
            <Col xs={24} sm={12} md={8}><Statistic title="Ví điện tử" value={formatMoney(summary.walletSales)} /></Col>
            <Col xs={24} sm={12} md={8}><Statistic title="Trả sau" value={formatMoney(summary.otherSales)} /></Col>
          </Row>
        </div>

        <div className="mt-5">
          <h3 className="mb-1 font-semibold">Dòng tiền và hóa đơn của ca</h3>
          <p className="mb-2 text-sm text-slate-500">Các hóa đơn đã mua trong ca và phiếu trả hàng liên quan đến các hóa đơn đó.</p>
          <Table
            size="small"
            pagination={false}
            rowKey={(row) => row.transactionType === 'SALE' ? `sale-${row.billCode}` : `return-${row.returnOrderId}`}
            dataSource={billFlow}
            locale={{ emptyText: 'Ca này chưa có hóa đơn thanh toán' }}
            columns={[
              { title: 'Thời gian', dataIndex: 'occurredAt', width: 130, render: (value: string) => dayjs(value).format('DD/MM HH:mm') },
              {
                title: 'Loại', dataIndex: 'transactionType', width: 150,
                render: (value: ShiftBillFlowDto['transactionType'], row: ShiftBillFlowDto) => value === 'SALE'
                  ? <Tag color="green">Hóa đơn bán</Tag>
                  : <Space direction="vertical" size={2}>
                    <Tag color="red">Trả hàng #{row.returnOrderId}</Tag>
                    {row.afterShiftClosed && <Tag color="orange">Sau đóng ca</Tag>}
                  </Space>,
              },
              { title: 'Mã hóa đơn', dataIndex: 'billCode', width: 150 },
              { title: 'Hàng hóa', dataIndex: 'itemSummary', ellipsis: false },
              { title: 'Thanh toán', dataIndex: 'paymentMethods', width: 150, render: paymentMethodLabel },
              {
                title: 'Số tiền', dataIndex: 'amount', width: 140, align: 'right' as const,
                render: (value: number, row: ShiftBillFlowDto) => row.transactionType === 'RETURN'
                  ? <span className="font-medium text-red-600">−{formatMoney(Math.abs(value))}</span>
                  : <span className="font-medium text-emerald-700">+{formatMoney(value)}</span>,
              },
            ]}
            scroll={{ x: 980 }}
          />
        </div>

        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4">
          <Statistic title="Số tiền thu được cuối ca" value={formatMoney(summary.netRevenue)} />
          <p className="mt-1 text-xs text-slate-500">Số này được chốt khi đóng ca và không thay đổi bởi hàng trả sau đó.</p>
          {summary.postCloseRefundAmount > 0 && <div className="mt-4 space-y-2 border-t border-emerald-200 pt-3">
            <div className="flex items-center justify-between text-red-600">
              <span>Thay đổi do trả hàng sau khi đóng ca</span>
              <strong>−{formatMoney(summary.postCloseRefundAmount)}</strong>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Số tiền sau điều chỉnh</span>
              <span>{formatMoney(summary.revenueAfterPostCloseReturns)}</span>
            </div>
          </div>}
        </div>
      </>}

      {auditHistory.length > 0 && <div className="mt-5">
        <h3 className="mb-2 font-semibold">Hoạt động ca</h3>
        <Table size="small" pagination={false} rowKey="id" dataSource={auditHistory} columns={[
          { title: 'Thời gian', dataIndex: 'createdAt', render: (value: string) => dayjs(value).format('DD/MM HH:mm') },
          { title: 'Người thực hiện', dataIndex: 'username' },
          { title: 'Vai trò', dataIndex: 'actorRole' },
          { title: 'Hành động', dataIndex: 'action' },
          { title: 'Nội dung', dataIndex: 'detail' },
        ]} />
      </div>}
    </Modal>
  </Card>;
}
