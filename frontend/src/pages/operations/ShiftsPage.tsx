import React, { useEffect, useState } from 'react';
import { Button, Col, Descriptions, Input, message, Modal, Radio, Row, Space, Statistic, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { Card, CardHeader } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney } from '@/lib/itemMapper';
import { normalizeRole } from '@/lib/permissions';
import {
  approveShift, closeShift, fetchCurrentShift, fetchShiftActivity, fetchShiftSummary, fetchShifts, openShift,
  requestManagerShiftUpdate, requestStaffShiftUpdate, submitManagerShiftReview,
  updateStaffShiftExplanation,
} from '@/services/shiftApi';
import type { AuditLogDto, ShiftDto, ShiftSummaryDto } from '@/types/api';

type ActionType = 'staff-update' | 'staff-explanation' | 'manager-review' | 'manager-update' | 'approve';

export default function ShiftsPage() {
  const { authUser } = useAuth();
  const role = normalizeRole(authUser?.role);
  const management = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';
  const [shifts, setShifts] = useState<ShiftDto[]>([]);
  const [current, setCurrent] = useState<ShiftDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [matches, setMatches] = useState(true);
  const [openingNote, setOpeningNote] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [explanation, setExplanation] = useState('');
  const [summary, setSummary] = useState<ShiftSummaryDto | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditLogDto[]>([]);
  const [action, setAction] = useState<{ shift: ShiftDto; type: ActionType } | null>(null);
  const [actionNote, setActionNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [active, list] = await Promise.all([fetchCurrentShift(), fetchShifts()]);
      setCurrent(active);
      setShifts(list);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không tải được ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleOpen = async () => {
    try {
      if (!openingNote.trim()) {
        message.warning('Vui lòng nhập ghi chú mở ca');
        return;
      }
      await openShift(openingNote.trim());
      setOpenModal(false);
      message.success('Mở ca thành công');
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Mở ca thất bại');
    }
  };

  const handleClose = async () => {
    if (!current) return;
    if (!matches && !explanation.trim()) {
      message.warning('Vui lòng nhập giải trình khi kết quả không khớp');
      return;
    }
    try {
      if (!closingNote.trim()) {
        message.warning('Vui lòng nhập ghi chú đóng ca');
        return;
      }
      await closeShift(current.id, matches, closingNote.trim(), explanation || undefined);
      setCloseModal(false);
      message.success('Đã đóng và gửi ca cho quản lý');
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Đóng ca thất bại');
    }
  };

  const handleSummary = async (shift: ShiftDto) => {
    try {
      setSummary(await fetchShiftSummary(shift.id));
      const history = await fetchShiftActivity(shift.id);
      setAuditHistory(history.content);
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
      OPEN: ['green', 'Đang mở'], PENDING_REVIEW: ['orange', 'Chờ quản lý'],
      NEEDS_STAFF_UPDATE: ['gold', 'Cần nhân viên giải trình'], REVIEWED_BY_MANAGER: ['blue', 'Chờ Admin'],
      NEEDS_MANAGER_UPDATE: ['purple', 'Cần quản lý kiểm tra'], APPROVED: ['green', 'Đã duyệt'],
      REJECTED: ['red', 'Từ chối'], CLOSED: ['default', 'Đã đóng (cũ)'],
    };
    return <Tag color={values[status][0]}>{values[status][1]}</Tag>;
  };

  const columns = [
    { title: 'Mã ca', dataIndex: 'id', render: (id: number) => `#${id}` },
    { title: 'Nhân viên', dataIndex: 'cashierName' },
    { title: 'Mở ca', dataIndex: 'openedAt', render: (value: string) => dayjs(value).format('DD/MM HH:mm') },
    { title: 'Đóng ca', dataIndex: 'closedAt', render: (value?: string) => value ? dayjs(value).format('DD/MM HH:mm') : '—' },
    { title: 'Doanh thu thuần', dataIndex: 'totalRevenue', render: (value: number) => formatMoney(value) },
    { title: 'Số đơn', dataIndex: 'totalOrders' },
    { title: 'Lệch', dataIndex: 'staffMismatchReported', render: (value?: boolean) => value ? <Tag color="red">Có</Tag> : <Tag color="green">Không</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
    {
      title: 'Thao tác', render: (_: unknown, shift: ShiftDto) => <Space wrap>
        <Button size="small" onClick={() => void handleSummary(shift)}>Chi tiết</Button>
        {management && shift.status === 'PENDING_REVIEW' && <>
          <Button size="small" onClick={() => openAction(shift, 'staff-update')}>Yêu cầu giải trình</Button>
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

  return <Card>
    <CardHeader title="Quản lý ca làm việc" description="Tổng hợp giao dịch tự động và đối soát nhiều cấp" action={
      current
        ? <Button danger type="primary" onClick={() => { setMatches(true); setExplanation(''); setClosingNote(''); setCloseModal(true); }}>Đóng ca</Button>
        : <Button type="primary" onClick={() => { setOpeningNote(''); setOpenModal(true); }}>Mở ca</Button>
    } />
    {current && <div className="px-5 pb-4"><Row gutter={16}>
      <Col span={8}><Statistic title="Ca đang mở" value={`#${current.id}`} /></Col>
      <Col span={8}><Statistic title="Mở lúc" value={dayjs(current.openedAt).format('DD/MM HH:mm')} /></Col>
      <Col span={8}><Statistic title="Giao dịch được gắn tự động" value="Đang theo dõi" /></Col>
    </Row></div>}
    <div className="px-5 pb-5">
      {!management && <p className="mb-3 text-xs text-slate-500">Bạn chỉ xem được lịch sử ca của chính mình.</p>}
      <Table rowKey="id" loading={loading} dataSource={shifts} columns={columns} scroll={{ x: 1100 }} />
    </div>

    <Modal title="Mở ca làm việc" open={openModal} onCancel={() => setOpenModal(false)} onOk={handleOpen}>
      <p className="mb-3">Số dư đầu ca được lấy tự động từ ca trước. Bạn không cần nhập số liệu tài chính.</p>
      <Input.TextArea rows={3} value={openingNote} onChange={(event) => setOpeningNote(event.target.value)}
        placeholder="Ghi chú mở ca (bắt buộc)" />
    </Modal>
    <Modal title="Đóng ca làm việc" open={closeModal} onCancel={() => setCloseModal(false)} onOk={handleClose}>
      <p className="mb-2">Kết quả thực tế có khớp dữ liệu hệ thống?</p>
      <Radio.Group value={matches} onChange={(event) => setMatches(event.target.value)}>
        <Space direction="vertical"><Radio value>Khớp</Radio><Radio value={false}>Không khớp</Radio></Space>
      </Radio.Group>
      <Input.TextArea className="mt-4" rows={3} value={closingNote}
        onChange={(event) => setClosingNote(event.target.value)} placeholder="Ghi chú đóng ca (bắt buộc)" />
      {!matches && <Input.TextArea className="mt-4" rows={4} value={explanation}
        onChange={(event) => setExplanation(event.target.value)} placeholder="Giải trình bắt buộc" />}
    </Modal>
    <Modal title="Ghi chú/lý do xử lý" open={!!action} onCancel={() => setAction(null)} onOk={runAction}
      okButtonProps={{ disabled: !actionNote.trim() }}>
      <Input.TextArea rows={4} value={actionNote} onChange={(event) => setActionNote(event.target.value)}
        placeholder="Nội dung bắt buộc và sẽ được lưu vào lịch sử kiểm toán" />
    </Modal>
    <Modal title={`Tổng kết ca #${summary?.shiftId ?? ''}`} open={!!summary} onCancel={() => setSummary(null)} footer={null} width={680}>
      {summary && <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Nhân viên">{summary.cashierName}</Descriptions.Item>
        <Descriptions.Item label="Thời gian">{dayjs(summary.openedAt).format('DD/MM/YYYY HH:mm')} → {summary.closedAt ? dayjs(summary.closedAt).format('DD/MM/YYYY HH:mm') : 'đang mở'}</Descriptions.Item>
        <Descriptions.Item label="Đơn tổng / hoàn tất / hủy / hoàn">{summary.totalOrders} / {summary.completedOrders} / {summary.cancelledOrders} / {summary.refundedOrders}</Descriptions.Item>
        <Descriptions.Item label="Số dư đầu ca">{formatMoney(summary.openingCash)}</Descriptions.Item>
        <Descriptions.Item label="Doanh thu gộp">{formatMoney(summary.grossSales)}</Descriptions.Item>
        <Descriptions.Item label="Tiền hoàn">{formatMoney(summary.refundAmount)}</Descriptions.Item>
        <Descriptions.Item label="Doanh thu thuần">{formatMoney(summary.netRevenue)}</Descriptions.Item>
        <Descriptions.Item label="Tiền mặt">{formatMoney(summary.cashSales)}</Descriptions.Item>
        <Descriptions.Item label="Chuyển khoản">{formatMoney(summary.bankSales)}</Descriptions.Item>
        <Descriptions.Item label="Thẻ / ví / khác">{formatMoney(summary.cardSales)} / {formatMoney(summary.walletSales)} / {formatMoney(summary.otherSales)}</Descriptions.Item>
        <Descriptions.Item label="Thanh toán không tiền mặt">{formatMoney(summary.nonCashSales)}</Descriptions.Item>
        <Descriptions.Item label="Số dư cuối ca">{summary.closingCash != null ? formatMoney(summary.closingCash) : '—'}</Descriptions.Item>
      </Descriptions>}
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
