import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, InputNumber, message, Statistic, Row, Col } from 'antd';
import { closeShift, fetchCurrentShift, fetchShifts, openShift } from '@/services/wmsApi';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/permissions';
import type { ShiftDto } from '@/types/api';
import dayjs from 'dayjs';
import { Card, CardHeader } from '@/components/ui';
import { formatMoney } from '@/lib/itemMapper';

export default function ShiftsPage() {
  const { authUser } = useAuth();
  const role = normalizeRole(authUser?.role);
  const canListAll = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';

  const [shifts, setShifts] = useState<ShiftDto[]>([]);
  const [current, setCurrent] = useState<ShiftDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [openingCash, setOpeningCash] = useState(0);
  const [closingCash, setClosingCash] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const cur = await fetchCurrentShift();
      setCurrent(cur);
      if (canListAll) {
        const list = await fetchShifts();
        setShifts(list);
      } else {
        setShifts(cur ? [cur] : []);
      }
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Lỗi tải ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [canListAll]);

  const handleOpen = async () => {
    try {
      await openShift(openingCash);
      message.success('Mở ca thành công');
      setOpenModal(false);
      load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Mở ca thất bại');
    }
  };

  const handleClose = async () => {
    if (!current) return;
    try {
      await closeShift(current.id, closingCash);
      message.success('Đóng ca thành công');
      setCloseModal(false);
      load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Đóng ca thất bại');
    }
  };

  const columns = [
    { title: 'Mã ca', dataIndex: 'id', render: (id: number) => `#${id}` },
    { title: 'Thu ngân', dataIndex: 'cashierName' },
    { title: 'Mở ca', dataIndex: 'openedAt', render: (v: string) => dayjs(v).format('DD/MM HH:mm') },
    { title: 'Đóng ca', dataIndex: 'closedAt', render: (v?: string) => v ? dayjs(v).format('DD/MM HH:mm') : '—' },
    { title: 'Doanh thu', dataIndex: 'totalRevenue', render: (v: number) => formatMoney(v) },
    { title: 'Số đơn', dataIndex: 'totalOrders' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: string) => <Tag color={s === 'OPEN' ? 'green' : 'default'}>{s === 'OPEN' ? 'Đang mở' : 'Đã đóng'}</Tag>,
    },
    {
      title: 'Chênh lệch tiền mặt',
      dataIndex: 'cashVariance',
      render: (v?: number) => v != null ? (
        <span className={Number(v) >= 0 ? 'text-green-600' : 'text-red-600'}>{formatMoney(v)}</span>
      ) : '—',
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Quản lý ca làm việc"
        description="Mở/đóng ca, đối chiếu tiền mặt cuối ca"
        action={
          current ? (
            <Button type="primary" danger onClick={() => { setClosingCash(0); setCloseModal(true); }}>Đóng ca hiện tại</Button>
          ) : (
            <Button type="primary" onClick={() => { setOpeningCash(0); setOpenModal(true); }}>Mở ca mới</Button>
          )
        }
      />
      {current && (
        <div className="px-5 pb-4">
          <Row gutter={16}>
            <Col span={6}><Statistic title="Ca đang mở" value={`#${current.id}`} /></Col>
            <Col span={6}><Statistic title="Tiền mở ca" value={formatMoney(current.openingCash)} /></Col>
            <Col span={6}><Statistic title="Doanh thu" value={formatMoney(current.totalRevenue)} /></Col>
            <Col span={6}><Statistic title="Số đơn" value={current.totalOrders} /></Col>
          </Row>
        </div>
      )}
      <div className="px-5 pb-5">
        {!canListAll && (
          <p className="mb-3 text-xs text-slate-500">Bạn chỉ xem được ca hiện tại của mình. Lịch sử đầy đủ dành cho Quản lý/Admin.</p>
        )}
        <Table rowKey="id" loading={loading} dataSource={shifts} columns={columns} />
      </div>
      <Modal title="Mở ca làm việc" open={openModal} onCancel={() => setOpenModal(false)} onOk={handleOpen}>
        <label className="text-sm">Tiền mặt đầu ca (VND)</label>
        <InputNumber className="w-full mt-2" min={0} value={openingCash} onChange={(v) => setOpeningCash(Number(v) || 0)} />
      </Modal>
      <Modal title="Đóng ca làm việc" open={closeModal} onCancel={() => setCloseModal(false)} onOk={handleClose}>
        <label className="text-sm">Tiền mặt thực tế cuối ca (VND)</label>
        <InputNumber className="w-full mt-2" min={0} value={closingCash} onChange={(v) => setClosingCash(Number(v) || 0)} />
      </Modal>
    </Card>
  );
}
