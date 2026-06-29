import * as React from 'react';
import { Button, Form, Input, InputNumber, Select, Table, Tabs, Tag, message } from 'antd';
import { ArrowRightLeft, ClipboardCheck } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import {
  cancelStockTransferOrder,
  confirmStockTransferOrder,
  createStockAdjustment,
  createStockTransfer,
  fetchInventory,
  fetchStockTransferOrders,
} from '@/services/wmsApi';
import { formatMoney, type Product } from '@/lib/itemMapper';
import type { InventoryItemDto, LocationDto, StockMovementDto, StockTransferOrderDto } from '@/types/api';

type StockMovementsPageProps = {
  productsList: Product[];
  locations: LocationDto[];
  reloadCatalog: () => Promise<void>;
};

type AdjustmentForm = {
  itemId: number;
  locationId: number;
  lotId?: number;
  actualQuantity: number;
  note?: string;
};

type TransferForm = {
  itemId: number;
  fromLocationId: number;
  toLocationId: number;
  lotId?: number;
  quantity: number;
  note?: string;
};

export default function StockMovementsPage({ productsList, locations, reloadCatalog }: StockMovementsPageProps) {
  const [adjustmentForm] = Form.useForm<AdjustmentForm>();
  const [transferForm] = Form.useForm<TransferForm>();
  const [inventory, setInventory] = React.useState<InventoryItemDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [lastMovement, setLastMovement] = React.useState<StockMovementDto | null>(null);
  const [transferOrders, setTransferOrders] = React.useState<StockTransferOrderDto[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState(false);

  const loadInventory = React.useCallback(() => {
    setLoading(true);
    fetchInventory()
      .then(setInventory)
      .catch(() => {
        setInventory([]);
        message.error('Không tải được tồn kho hiện tại');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const loadTransferOrders = React.useCallback(() => {
    setLoadingOrders(true);
    fetchStockTransferOrders()
      .then(setTransferOrders)
      .catch(() => message.error('Không tải phiếu điều chuyển'))
      .finally(() => setLoadingOrders(false));
  }, []);

  React.useEffect(() => {
    loadTransferOrders();
  }, [loadTransferOrders]);

  const handleConfirmOrder = async (id: number) => {
    try {
      await confirmStockTransferOrder(id);
      message.success('Đã xác nhận phiếu điều chuyển');
      loadTransferOrders();
      await Promise.all([reloadCatalog(), Promise.resolve(loadInventory())]);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Xác nhận thất bại');
    }
  };

  const handleCancelOrder = async (id: number) => {
    try {
      await cancelStockTransferOrder(id);
      message.success('Đã hủy phiếu điều chuyển');
      loadTransferOrders();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Hủy thất bại');
    }
  };

  const productOptions = React.useMemo(
    () => productsList.map((product) => ({
      value: Number(product.key),
      label: `${product.sku} · ${product.name}`,
    })),
    [productsList]
  );

  const locationOptions = React.useMemo(
    () => locations
      .filter((location) => location.active !== false)
      .map((location) => ({ value: location.id, label: location.locationName })),
    [locations]
  );

  const buildLotOptions = (itemId?: number, locationId?: number) => inventory
    .filter((row) => (!itemId || row.itemId === itemId) && (!locationId || row.locationId === locationId))
    .filter((row) => row.lotId)
    .map((row) => ({
      value: row.lotId!,
      label: `${row.lotNumber || `Lô #${row.lotId}`} · tồn ${row.availableQuantity}`,
    }));

  const currentRows = React.useMemo(() => inventory.slice(0, 8), [inventory]);

  const afterSuccess = async (movement: StockMovementDto, fallbackMessage: string) => {
    setLastMovement(movement);
    message.success(fallbackMessage);
    await Promise.all([reloadCatalog(), Promise.resolve(loadInventory())]);
  };

  const handleAdjustment = async (values: AdjustmentForm) => {
    setSubmitting(true);
    try {
      const movement = await createStockAdjustment({
        ...values,
        actualQuantity: Number(values.actualQuantity),
      });
      adjustmentForm.resetFields();
      await afterSuccess(movement, 'Đã ghi nhận điều chỉnh tồn kho');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Điều chỉnh tồn kho thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (values: TransferForm) => {
    setSubmitting(true);
    try {
      const movement = await createStockTransfer({
        ...values,
        quantity: Number(values.quantity),
      });
      transferForm.resetFields();
      await afterSuccess(movement, 'Đã ghi nhận điều chuyển kho');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Điều chuyển kho thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const adjustmentItemId = Form.useWatch('itemId', adjustmentForm);
  const adjustmentLocationId = Form.useWatch('locationId', adjustmentForm);
  const transferItemId = Form.useWatch('itemId', transferForm);
  const transferFromLocationId = Form.useWatch('fromLocationId', transferForm);

  const movementSummary = lastMovement && (
    <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      <strong>{lastMovement.itemName}</strong>
      {lastMovement.actionType === 'ADJUSTMENT'
        ? ` · ${lastMovement.locationName} · ${lastMovement.quantityBefore ?? 0} → ${lastMovement.quantityAfter ?? 0}`
        : ` · ${lastMovement.fromLocationName} → ${lastMovement.toLocationName} · ${lastMovement.quantity}`}
    </div>
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader
          title="Điều chuyển & điều chỉnh tồn"
          description="Ghi nhận biến động kho thủ công, tất cả phát sinh sẽ vào nhật ký tồn kho."
        />
        <div className="px-5 pb-5">
          <Tabs
            items={[
              {
                key: 'adjustment',
                label: 'Điều chỉnh tồn',
                children: (
                  <Form form={adjustmentForm} layout="vertical" onFinish={handleAdjustment}>
                    <Form.Item name="itemId" label="Sản phẩm" rules={[{ required: true, message: 'Chọn sản phẩm' }]}>
                      <Select showSearch options={productOptions} optionFilterProp="label" placeholder="Chọn sản phẩm" />
                    </Form.Item>
                    <Form.Item name="locationId" label="Vị trí kho" rules={[{ required: true, message: 'Chọn vị trí kho' }]}>
                      <Select options={locationOptions} placeholder="Chọn vị trí kho" />
                    </Form.Item>
                    <Form.Item name="lotId" label="Lô hàng">
                      <Select
                        allowClear
                        options={buildLotOptions(adjustmentItemId, adjustmentLocationId)}
                        placeholder="Không chọn nếu tồn không theo lô"
                      />
                    </Form.Item>
                    <Form.Item name="actualQuantity" label="Tồn thực tế" rules={[{ required: true, message: 'Nhập tồn thực tế' }]}>
                      <InputNumber className="w-full" min={0} precision={2} />
                    </Form.Item>
                    <Form.Item name="note" label="Ghi chú">
                      <Input.TextArea rows={3} placeholder="Lý do điều chỉnh" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={submitting} icon={<ClipboardCheck size={16} />}>
                      Ghi nhận điều chỉnh
                    </Button>
                  </Form>
                ),
              },
              {
                key: 'transfer',
                label: 'Điều chuyển kho',
                children: (
                  <Form form={transferForm} layout="vertical" onFinish={handleTransfer}>
                    <Form.Item name="itemId" label="Sản phẩm" rules={[{ required: true, message: 'Chọn sản phẩm' }]}>
                      <Select showSearch options={productOptions} optionFilterProp="label" placeholder="Chọn sản phẩm" />
                    </Form.Item>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Form.Item name="fromLocationId" label="Kho nguồn" rules={[{ required: true, message: 'Chọn kho nguồn' }]}>
                        <Select options={locationOptions} placeholder="Kho nguồn" />
                      </Form.Item>
                      <Form.Item name="toLocationId" label="Kho đích" rules={[{ required: true, message: 'Chọn kho đích' }]}>
                        <Select options={locationOptions} placeholder="Kho đích" />
                      </Form.Item>
                    </div>
                    <Form.Item name="lotId" label="Lô hàng">
                      <Select
                        allowClear
                        options={buildLotOptions(transferItemId, transferFromLocationId)}
                        placeholder="Không chọn nếu tồn không theo lô"
                      />
                    </Form.Item>
                    <Form.Item name="quantity" label="Số lượng chuyển" rules={[{ required: true, message: 'Nhập số lượng chuyển' }]}>
                      <InputNumber className="w-full" min={0.01} precision={2} />
                    </Form.Item>
                    <Form.Item name="note" label="Ghi chú">
                      <Input.TextArea rows={3} placeholder="Lý do điều chuyển" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={submitting} icon={<ArrowRightLeft size={16} />}>
                      Ghi nhận điều chuyển
                    </Button>
                  </Form>
                ),
              },
            ]}
          />
          {movementSummary && <div className="mt-4">{movementSummary}</div>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Phiếu điều chuyển kho" description="Danh sách phiếu điều chuyển — xác nhận hoặc hủy." />
        <div className="px-5 pb-5">
          <Table
            rowKey="id"
            loading={loadingOrders}
            dataSource={transferOrders}
            size="small"
            columns={[
              { title: 'Mã', dataIndex: 'transferCode' },
              { title: 'Từ', dataIndex: 'fromLocationName' },
              { title: 'Đến', dataIndex: 'toLocationName' },
              { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag color={s === 'CONFIRMED' ? 'green' : s === 'CANCELLED' ? 'red' : 'gold'}>{s}</Tag> },
              { title: 'SL dòng', render: (_: unknown, r: StockTransferOrderDto) => r.items?.length ?? 0 },
              {
                title: '',
                render: (_: unknown, r: StockTransferOrderDto) =>
                  r.status === 'PENDING' ? (
                    <div className="flex gap-1">
                      <Button size="small" type="primary" onClick={() => handleConfirmOrder(r.id)}>Xác nhận</Button>
                      <Button size="small" danger onClick={() => handleCancelOrder(r.id)}>Hủy</Button>
                    </div>
                  ) : null,
              },
            ]}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Tồn kho gần đây" action={<Tag color="blue">{inventory.length} dòng</Tag>} />
        <div className="px-5 pb-5">
          <Table
            rowKey={(row) => `${row.itemId}-${row.locationId}-${row.lotId || 'none'}`}
            loading={loading}
            dataSource={currentRows}
            pagination={false}
            size="small"
            columns={[
              {
                title: 'Sản phẩm',
                dataIndex: 'itemName',
                render: (value, row) => (
                  <div>
                    <div className="font-semibold text-ink">{value}</div>
                    <div className="text-xs text-slate-400">{row.itemCode}</div>
                  </div>
                ),
              },
              { title: 'Kho', dataIndex: 'locationName' },
              {
                title: 'Tồn',
                dataIndex: 'availableQuantity',
                align: 'right',
                render: (value) => formatMoney(Number(value)).replace('₫', ''),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
