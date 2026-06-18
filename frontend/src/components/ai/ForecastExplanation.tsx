import { Alert, List, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  RiseOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { AiStatusDto, ForecastResultDto } from '@/types/api';

const { Paragraph, Text, Title } = Typography;

type Props = {
  results: ForecastResultDto[];
  aiStatus: AiStatusDto | null;
  ranAt?: Date;
};

function modelLabel(type?: string) {
  if (type === 'random_forest') return 'Random Forest';
  if (type === 'xgboost') return 'XGBoost';
  return 'Trung bình động (MA)';
}

function riskTag(level?: ForecastResultDto['riskLevel']) {
  switch (level) {
    case 'CRITICAL':
      return <Tag color="error">Thiếu gấp</Tag>;
    case 'WARNING':
      return <Tag color="warning">Sắp thiếu</Tag>;
    case 'OVERSTOCK':
      return <Tag color="purple">Tồn dư</Tag>;
    default:
      return <Tag color="success">Đủ tồn</Tag>;
  }
}

export function ForecastExplanation({ results, aiStatus, ranAt }: Props) {
  if (results.length === 0) return null;

  const critical = results.filter((r) => r.riskLevel === 'CRITICAL');
  const warning = results.filter((r) => r.riskLevel === 'WARNING');
  const ok = results.filter((r) => r.riskLevel === 'OK' || !r.riskLevel);
  const overstock = results.filter((r) => r.riskLevel === 'OVERSTOCK');
  const needOrder = [...critical, ...warning].sort(
    (a, b) => (Number(b.shortageQty) || 0) - (Number(a.shortageQty) || 0)
  );

  const timeLabel = ranAt
    ? ranAt.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'vừa xong';

  return (
    <div className="space-y-4">
      <Alert
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        message={
          <span className="font-semibold">
            Dự báo hoàn tất — {results.length} sản phẩm · lúc {timeLabel}
          </span>
        }
        description={
          <div className="mt-1 space-y-2 text-sm leading-relaxed">
            <Paragraph className="!mb-0">
              Hệ thống so sánh <Text strong>nhu cầu bán dự kiến 30 ngày</Text> với{' '}
              <Text strong>tồn kho hiện có</Text> để đưa ra gợi ý nhập hàng. Mô hình:{' '}
              <Tag color="blue">{modelLabel(aiStatus?.modelType)}</Tag>
            </Paragraph>
            <Paragraph className="!mb-0">
              <Tag color="error">{critical.length} cần nhập gấp</Tag>{' '}
              <Tag color="warning">{warning.length} nên đặt hàng</Tag>{' '}
              <Tag color="success">{ok.length} đủ tồn</Tag>
              {overstock.length > 0 && <Tag color="purple">{overstock.length} tồn dư</Tag>}
            </Paragraph>
          </div>
        }
      />

      {needOrder.length > 0 && (
        <Alert
          type={critical.length > 0 ? 'error' : 'warning'}
          showIcon
          icon={critical.length > 0 ? <ExclamationCircleOutlined /> : <WarningOutlined />}
          message={critical.length > 0 ? 'Ưu tiên nhập hàng ngay' : 'Nên lên kế hoạch nhập hàng'}
          description={
            <List
              size="small"
              className="mt-2"
              dataSource={needOrder.slice(0, 6)}
              renderItem={(item) => (
                <List.Item className="!px-0 !py-1">
                  <div className="flex w-full flex-wrap items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      {riskTag(item.riskLevel)}
                      <Text strong ellipsis className="max-w-[220px]">
                        {item.itemName ?? item.itemCode}
                      </Text>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-slate-600">
                      Tồn {Math.round(Number(item.stockOnHand) || 0).toLocaleString('vi-VN')} → cần{' '}
                      {Math.round(Number(item.pred30d) || 0).toLocaleString('vi-VN')} (
                      <Text type="danger">thiếu ~{Math.round(Number(item.shortageQty) || 0).toLocaleString('vi-VN')}</Text>)
                    </span>
                  </div>
                </List.Item>
              )}
            />
          }
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-slate-50/80 p-4">
          <Title level={5} className="!mb-3 flex items-center gap-2 !text-base">
            <InfoCircleOutlined className="text-indigo" />
            Cách đọc bảng kết quả
          </Title>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <Text strong>Tồn hiện tại:</Text> số lượng có thể bán ngay (tất cả kho).
            </li>
            <li>
              <Text strong>Cần 30 ngày:</Text> lượng dự kiến bán trong 30 ngày tới.
            </li>
            <li>
              <Text strong>Thiếu/Dư:</Text> chênh lệch giữa tồn và nhu cầu — số dương là thiếu hàng.
            </li>
            <li>
              <Text strong>Trạng thái:</Text> Đủ tồn / Sắp thiếu / Thiếu gấp / Tồn dư.
            </li>
            <li>Nhấn một dòng để xem biểu đồ chi tiết theo ngày.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-line bg-white p-4">
          <Title level={5} className="!mb-3 flex items-center gap-2 !text-base">
            <RiseOutlined className="text-emerald-600" />
            Nhu cầu cao nhất (30 ngày)
          </Title>
          <List
            size="small"
            dataSource={[...results]
              .sort((a, b) => (Number(b.pred30d) || 0) - (Number(a.pred30d) || 0))
              .slice(0, 5)}
            renderItem={(item, idx) => (
              <List.Item className="!px-0">
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Tag color={idx === 0 ? 'green' : 'default'}>{idx + 1}</Tag>
                    <Text ellipsis className="max-w-[180px]">
                      {item.itemName ?? item.itemCode}
                    </Text>
                  </span>
                  <Text strong className="shrink-0 tabular-nums text-emerald-700">
                    {Math.round(Number(item.pred30d) || 0).toLocaleString('vi-VN')} sp
                  </Text>
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  );
}
