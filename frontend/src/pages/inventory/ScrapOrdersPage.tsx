import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Input, message, Drawer, Space, Typography } from 'antd';
import { 
  fetchScrapOrders, 
  approveScrapOrder, 
  cancelScrapOrder,
  fetchLocations,
  fetchItems,
  fetchInventory,
  createScrapOrder
} from '@/services/wmsApi';
import type { ScrapOrderDto, LocationDto, ItemDto, InventoryItemDto } from '@/types/api';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import type { PageKey } from '@/types/pages';

const { Text } = Typography;

const selectClass = "h-8 px-2 bg-white border border-slate-200 rounded text-sm text-slate-700 transition-all hover:border-emerald-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100";

type LineForm = { itemId: number; lotId?: number; quantity: number; reason: string };

export default function ScrapOrdersPage({ setPage }: { setPage: (page: PageKey) => void }) {
  const { authUser } = useAuth();
  const role = authUser?.role?.replace('ROLE_', '') ?? '';
  const isAdminOrManager = role === 'ADMIN' || role === 'MANAGER';

  const [orders, setOrders] = useState<ScrapOrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  // Base Data for Create Modal
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [items, setItems] = useState<ItemDto[]>([]);
  const [inventory, setInventory] = useState<InventoryItemDto[]>([]);

  // Create Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [locationId, setLocationId] = useState<number | undefined>();
  const [lines, setLines] = useState<LineForm[]>([]);

  // Auto-save logic
  useEffect(() => {
    try {
      const stored = localStorage.getItem('draft_scrap_create');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < 300000) { // 5 minutes
          if (parsed.locationId) setLocationId(parsed.locationId);
          if (parsed.lines && parsed.lines.length > 0) setLines(parsed.lines);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (locationId || lines.length > 0) {
      try {
        localStorage.setItem('draft_scrap_create', JSON.stringify({
          timestamp: Date.now(),
          locationId,
          lines
        }));
      } catch (e) {}
    }
  }, [locationId, lines]);

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

  const loadBaseData = async () => {
    try {
      const [locsRes, itemsRes, invRes] = await Promise.all([
        fetchLocations(),
        fetchItems(),
        fetchInventory(),
      ]);
      setLocations(locsRes || []);
      setItems(itemsRes || []);
      setInventory(invRes || []);
    } catch (err: any) {
      message.error('Lỗi tải dữ liệu cơ sở: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    loadBaseData();
  }, []);

  const handleCreate = async () => {
    if (!locationId) return message.error("Vui lòng chọn kho xuất hủy");
    if (lines.length === 0) return message.error("Vui lòng thêm ít nhất một mặt hàng");
    
    for (const line of lines) {
      if (!line.itemId || !line.quantity || !line.reason) {
        return message.error("Vui lòng nhập đầy đủ thông tin cho các dòng (Sản phẩm, Số lượng, Lý do)");
      }
    }

    try {
      setLoading(true);
      await createScrapOrder({ locationId, items: lines });
      message.success('Gửi yêu cầu hủy hàng thành công!');
      setCreateOpen(false);
      setLines([]);
      setLocationId(undefined);
      localStorage.removeItem('draft_scrap_create');
      loadData();
      loadBaseData(); // Refresh inventory
    } catch (err: any) {
      message.error(err.message || 'Lỗi tạo phiếu hủy');
    } finally {
      setLoading(false);
    }
  };

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
    <Card>
      <CardHeader
        title="Phiếu hủy hàng"
        description="Quản lý và tạo mới các yêu cầu loại bỏ hàng hóa hỏng, lỗi, hoặc hết hạn"
        action={
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Tạo phiếu hủy
          </Button>
        }
      />
      <div className="px-5 pb-5">
        <select
          className={`${selectClass} mb-4 w-40`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Tất cả</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="COMPLETED">Đã duyệt</option>
          <option value="CANCELLED">Đã từ chối</option>
        </select>

        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* CREATE MODAL */}
      <Modal title="Tạo phiếu xuất hủy" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={handleCreate} width={800} okText="Gửi yêu cầu" cancelText="Hủy">
        <div className="mb-4">
          <label className="text-xs font-semibold">Kho xuất hủy</label>
          <select className={`${selectClass} w-full mt-1`} value={locationId || ''} onChange={(e) => {
            setLocationId(Number(e.target.value) || undefined);
            setLines([]); 
          }}>
            <option value="" disabled>-- Chọn kho --</option>
            {locations.map((l) => (<option key={l.id} value={l.id}>{l.locationName}</option>))}
          </select>
        </div>
        
        {lines.map((line, idx) => {
          const availableItems = items.filter(i => inventory.some(inv => inv.locationId === locationId && inv.itemId === i.id && Number(inv.quantity) > 0));
          return (
            <div key={idx} className="flex gap-2 mb-2">
              <select className={`${selectClass} w-48`} value={line.itemId || ''}
                onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, itemId: Number(e.target.value) || 0, lotId: undefined } : l))}>
                <option value="" disabled>-- Sản phẩm --</option>
                {availableItems.map((i) => (<option key={i.id} value={i.id}>{i.itemName}</option>))}
              </select>
              <select className={`${selectClass} w-48`} value={line.lotId || ''}
                onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, lotId: e.target.value ? Number(e.target.value) : undefined } : l))}>
                <option value="">-- Lô (nếu có) --</option>
                {inventory.filter((inv) => inv.itemId === line.itemId && inv.locationId === locationId && Number(inv.quantity) > 0)
                  .map((inv) => (<option key={inv.lotId} value={inv.lotId || ''}>{inv.lotNumber || '—'} (Còn: {inv.quantity})</option>))}
              </select>
              <input type="number" min="0.01" step="0.01" className={`${selectClass} w-24`} value={line.quantity || ''} placeholder="SL"
                onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, quantity: Number(e.target.value) || 0 } : l))} />
              <input type="text" className={`${selectClass} flex-1`} value={line.reason || ''} placeholder="Lý do hủy"
                onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, reason: e.target.value } : l))} />
              <button type="button" className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center transition-colors rounded hover:bg-red-50" onClick={() => setLines(lines.filter((_, i) => i !== idx))}>
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )
        })}
        <Button type="dashed" block disabled={!locationId} onClick={() => setLines([...lines, { itemId: 0, quantity: 1, reason: '' }])}>+ Thêm mặt hàng</Button>
      </Modal>

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
    </Card>
  );
}
