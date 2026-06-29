import { Button, Input, Select, Table, message, Space, Row, Col, Statistic, Card as AntCard } from 'antd';
import { AlertTriangle, Download, Search } from 'lucide-react';
import * as React from 'react';
import { Card, StatusChip } from '@/components/ui';
import { fetchInventoryAlerts, resolveInventoryAlert } from '@/services/wmsApi';
import type { InventoryAlertDto } from '@/types/api';
import type { PageKey } from '@/types/pages';
import * as XLSX from 'xlsx';

function alertActionPage(alertType: string): PageKey {
  switch (alertType) {
    case 'NEAR_EXPIRY':
    case 'OVERSTOCK':
      return 'promotions';
    case 'HIGH_RISK':
    case 'LOW_STOCK':
    default:
      return 'import-create';
  }
}

function alertActionLabel(alertType: string): string {
  switch (alertType) {
    case 'NEAR_EXPIRY':
      return 'Xem đề xuất KM';
    case 'OVERSTOCK':
      return 'Xử lý tồn dư';
    case 'HIGH_RISK':
    case 'LOW_STOCK':
    default:
      return 'Tạo phiếu nhập';
  }
}

export default function InventoryAlertsPage({ setPage }: { setPage: (page: PageKey) => void }) {
  const [alerts, setAlerts] = React.useState<InventoryAlertDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [resolvingId, setResolvingId] = React.useState<number | null>(null);

  // Filters
  const [searchText, setSearchText] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<string>('ALL');

  const loadAlerts = React.useCallback(() => {
    setLoading(true);
    fetchInventoryAlerts()
      .then(setAlerts)
      .catch(() => {
        setAlerts([]);
        message.error('Không tải được danh sách cảnh báo');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleResolve = async (alertId: number) => {
    setResolvingId(alertId);
    try {
      await resolveInventoryAlert(alertId);
      message.success('Đã đánh dấu cảnh báo đã xử lý');
      loadAlerts();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không thể cập nhật cảnh báo');
    } finally {
      setResolvingId(null);
    }
  };

  const filteredAlerts = React.useMemo(() => {
    return alerts.filter(alert => {
      const matchSearch = 
        alert.itemName.toLowerCase().includes(searchText.toLowerCase()) || 
        alert.itemCode.toLowerCase().includes(searchText.toLowerCase());
      const matchType = selectedType === 'ALL' || alert.alertType === selectedType;
      return matchSearch && matchType;
    });
  }, [alerts, searchText, selectedType]);

  const handleExportExcel = () => {
    const dataToExport = filteredAlerts.map(alert => {
      const date = new Date(alert.createdAt);
      const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      return {
        'Mã SP': alert.itemCode,
        'Tên SP': alert.itemName,
        'Loại cảnh báo': alert.alertType,
        'Mức độ': alert.severity,
        'Tồn kho': alert.currentStock || 0,
        'Khả dụng': alert.availableQuantity || 0,
        'Đã đặt': alert.reservedQuantity || 0,
        'Tồn tối thiểu': alert.minimumStock || 0,
        'Kho': alert.locationName || 'Tất cả kho',
        'Mô tả': alert.message,
        'Ngày tạo': dateStr,
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CanhBaoTonKho");
    
    const d = new Date();
    const ts = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
    XLSX.writeFile(wb, `Canh_Bao_Ton_Kho_${ts}.xlsx`);
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text: string, record: InventoryAlertDto) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-xs text-slate-500 font-mono">{record.itemCode}</div>
        </div>
      ),
    },
    {
      title: 'Kho',
      dataIndex: 'locationName',
      key: 'locationName',
      render: (text: string) => text || 'Tất cả kho'
    },
    {
      title: 'Tồn kho',
      key: 'stock',
      render: (_: any, record: InventoryAlertDto) => (
        <div className="text-xs">
          <div>TT: <span className="font-medium text-slate-700">{record.currentStock || 0}</span></div>
          <div>KD: <span className="font-medium text-green-600">{record.availableQuantity || 0}</span></div>
          <div>Đặt: <span className="font-medium text-amber-600">{record.reservedQuantity || 0}</span></div>
          <div className="text-slate-400">Min: {record.minimumStock || 0}</div>
        </div>
      )
    },
    {
      title: 'Cảnh báo',
      dataIndex: 'alertType',
      key: 'alertType',
      render: (text: string, record: InventoryAlertDto) => (
        <Space direction="vertical" size={2}>
          <StatusChip tone={record.severity === 'CRITICAL' ? 'danger' : 'warning'}>{text}</StatusChip>
          <div className="text-xs text-slate-500 max-w-[200px] line-clamp-2" title={record.message}>{record.message}</div>
        </Space>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: InventoryAlertDto) => (
        <Space direction="vertical" size="small" className="w-full">
          <Button type="primary" size="small" block onClick={() => setPage(alertActionPage(record.alertType))}>
            {alertActionLabel(record.alertType)}
          </Button>
          <Button
            size="small"
            block
            loading={resolvingId === record.id}
            onClick={() => handleResolve(record.id)}
          >
            Đã xử lý
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Row gutter={16}>
        <Col span={8}>
          <AntCard size="small">
            <Statistic title="Tổng cảnh báo" value={alerts.length} prefix={<AlertTriangle size={18} className="text-amber-500 mr-2"/>} />
          </AntCard>
        </Col>
        <Col span={8}>
          <AntCard size="small">
            <Statistic title="Cảnh báo nghiêm trọng" value={alerts.filter(a => a.severity === 'CRITICAL').length} valueStyle={{ color: '#cf1322' }} />
          </AntCard>
        </Col>
        <Col span={8}>
          <AntCard size="small">
            <Statistic title="Cảnh báo cần xử lý" value={alerts.filter(a => !a.resolved).length} />
          </AntCard>
        </Col>
      </Row>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <Space>
            <Input
              placeholder="Tìm theo tên hoặc mã SP..."
              prefix={<Search size={16} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64"
            />
            <Select
              value={selectedType}
              onChange={setSelectedType}
              className="w-48"
              options={[
                { value: 'ALL', label: 'Tất cả loại' },
                { value: 'LOW_STOCK', label: 'Sắp hết hàng' },
                { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
                { value: 'NEAR_EXPIRY', label: 'Sắp hết hạn' },
                { value: 'EXPIRED', label: 'Đã hết hạn' },
                { value: 'OVERSTOCK', label: 'Tồn dư' },
                { value: 'HIGH_RISK', label: 'Nguy cơ cao' },
              ]}
            />
          </Space>
          <Button icon={<Download size={16} />} onClick={handleExportExcel} disabled={filteredAlerts.length === 0}>
            Xuất Excel
          </Button>
        </div>

        <Table
          dataSource={filteredAlerts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Không có cảnh báo chưa xử lý.' }}
        />
      </Card>
    </div>
  );
}
