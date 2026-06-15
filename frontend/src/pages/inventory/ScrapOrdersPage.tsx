import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Select, Modal, Input, message, Drawer, Space, Typography } from 'antd';
import { fetchScrapOrders, approveScrapOrder, cancelScrapOrder } from '@/services/wmsApi';
import type { ScrapOrderDto } from '@/types/api';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';

const { Text } = Typography;

export default function ScrapOrdersPage() {
  const { authUser } = useAuth();
  const role = authUser?.role?.replace('ROLE_', '') ?? '';
  const isAdminOrManager = role === 'ADMIN' || role === 'MANAGER';

  const [orders, setOrders] = useState<ScrapOrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  // Drawer state
  const [selectedOrder, setSelectedOrder] = useState<ScrapOrderDto | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Reject Modal state
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchScrapOrders(statusFilter !== 'ALL' ? statusFilter : undefined);
      if (res) {
        setOrders(res);
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi tải danh sách phiếu hủy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleApprove = async (id: number) => {
    try {
      setLoading(true);
      await approveScrapOrder(id);
      message.success('Đã duyệt phiếu hủy và trừ tồn kho thành công!');
      setDrawerVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Lỗi duyệt phiếu');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (id: number) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectVisible(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      message.error('Vui lòng nhập lý do từ chối');
      return;
    }
    if (!rejectingId) return;

    try {
      setLoading(true);
      await cancelScrapOrder(rejectingId, rejectReason);
      message.success('Đã từ chối phiếu hủy!');
      setRejectVisible(false);
      setDrawerVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Lỗi từ chối phiếu');
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Tag color="warning">Chờ duyệt</Tag>;
      case 'COMPLETED':
        return <Tag color="success">Đã duyệt</Tag>;
      case 'CANCELLED':
        return <Tag color="error">Đã từ chối</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Mã Phiếu',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => `SCRAP-${id.toString().padStart(4, '0')}`,
    },
    {
      title: 'Kho',
      dataIndex: 'locationName',
      key: 'locationName',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'scrapDate',
      key: 'scrapDate',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: renderStatus,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: ScrapOrderDto) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedOrder(record);
            setDrawerVisible(true);
          }}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const itemColumns = [
    { title: 'Sản phẩm', dataIndex: 'itemName', key: 'itemName' },
    { title: 'Lô hàng', dataIndex: 'lotNumber', key: 'lotNumber', render: (val: string) => val ? val : '—' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Lý do', dataIndex: 'reason', key: 'reason' },
  ];

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-end items-center mb-4">
        <select
          className="w-[150px] h-8 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:border-primary"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Tất cả</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="COMPLETED">Đã duyệt</option>
          <option value="CANCELLED">Đã từ chối</option>
        </select>
      </div>

      <Table
        dataSource={orders}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title={`Chi tiết phiếu hủy SCRAP-${selectedOrder?.id?.toString().padStart(4, '0')}`}
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          selectedOrder?.status === 'PENDING' && isAdminOrManager && (
            <Space>
              <Button danger onClick={() => handleRejectClick(selectedOrder.id)}>
                Từ chối
              </Button>
              <Button type="primary" onClick={() => handleApprove(selectedOrder.id)}>
                Đồng ý duyệt
              </Button>
            </Space>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text type="secondary">Kho xuất hủy</Text>
                <div className="font-medium">{selectedOrder.locationName}</div>
              </div>
              <div>
                <Text type="secondary">Trạng thái</Text>
                <div>{renderStatus(selectedOrder.status)}</div>
              </div>
              <div>
                <Text type="secondary">Ngày tạo</Text>
                <div className="font-medium">{dayjs(selectedOrder.scrapDate).format('DD/MM/YYYY HH:mm')}</div>
              </div>
            </div>

            {selectedOrder.note && (
              <div className="bg-gray-50 p-3 rounded text-sm">
                <Text type="secondary">Ghi chú / Lý do từ chối:</Text>
                <p className="mt-1 whitespace-pre-wrap">{selectedOrder.note}</p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-medium mb-2">Danh sách mặt hàng</h3>
              <Table
                dataSource={selectedOrder.items}
                columns={itemColumns}
                rowKey="itemId"
                pagination={false}
                size="small"
              />
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="Từ chối phiếu hủy"
        open={rejectVisible}
        onOk={confirmReject}
        onCancel={() => setRejectVisible(false)}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true }}
      >
        <div className="mb-2">Vui lòng nhập lý do từ chối (bắt buộc):</div>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do chi tiết..."
        />
      </Modal>
    </div>
  );
}
