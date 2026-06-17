import { Alert, List, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  RiseOutlined,
  ShoppingOutlined,
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

export function ForecastExplanation({ results, aiStatus, ranAt }: Props) {
  if (results.length === 0) return null;

  const sorted = [...results].sort((a, b) => (Number(b.pred30d) || 0) - (Number(a.pred30d) || 0));
  const topItems = sorted.slice(0, 5);
  const total30d = results.reduce((sum, r) => sum + (Number(r.pred30d) || 0), 0);
  const avg7d = results.reduce((sum, r) => sum + (Number(r.pred7d) || 0), 0) / results.length;
  const highDemandCount = results.filter((r) => (Number(r.pred30d) || 0) >= avg7d * 4).length;

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
              Hệ thống đã ước tính <Text strong>nhu cầu bán ra</Text> cho từng SKU dựa trên lịch sử bán hàng.
              Mô hình đang dùng: <Tag color="blue">{modelLabel(aiStatus?.modelType)}</Tag>
            </Paragraph>
            <Paragraph className="!mb-0">
              <Text strong>Tổng nhu cầu 30 ngày tới (ước tính):</Text>{' '}
              {Math.round(total30d).toLocaleString('vi-VN')} đơn vị trên {results.length} mặt hàng.
              {highDemandCount > 0 && (
                <>
                  {' '}
                  Có <Text type="warning">{highDemandCount} SKU</Text> có xu hướng bán cao — nên ưu tiên kiểm tra tồn.
                </>
              )}
            </Paragraph>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-slate-50/80 p-4">
          <Title level={5} className="!mb-3 flex items-center gap-2 !text-base">
            <InfoCircleOutlined className="text-indigo" />
            Cách đọc bảng kết quả
          </Title>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <Text strong>7 / 14 / 30 ngày:</Text> số lượng dự kiến bán trong khoảng thời gian tương ứng (đơn vị: cái/hộp).
            </li>
            <li>
              <Text strong>Khoảng tin cậy (30d):</Text> biên dao động thấp–cao; càng hẹp thì dự báo càng ổn định.
            </li>
            <li>
              <Text strong>Model:</Text> thuật toán ML đã chọn cho SKU đó (RF / XGB / MA).
            </li>
            <li>Nhấn một dòng trong bảng để xem biểu đồ chi tiết 30 ngày bên dưới.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-line bg-white p-4">
          <Title level={5} className="!mb-3 flex items-center gap-2 !text-base">
            <RiseOutlined className="text-emerald-600" />
            Top SKU nhu cầu cao (30 ngày)
          </Title>
          <List
            size="small"
            dataSource={topItems}
            renderItem={(item, idx) => (
              <List.Item className="!px-0">
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Tag color={idx === 0 ? 'green' : 'default'}>{idx + 1}</Tag>
                    <Text ellipsis className="max-w-[180px]">
                      {item.itemName ?? `SKU #${item.itemId}`}
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

      <Alert
        type="info"
        showIcon
        icon={<LineChartOutlined />}
        message="Gợi ý hành động"
        description={
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
            <li>So sánh cột <ShoppingOutlined /> <Text strong>30 ngày</Text> với tồn kho hiện tại — nếu tồn thấp hơn dự báo, cân nhắc nhập thêm.</li>
            <li>Vào <Text strong>Gợi ý nhập hàng</Text> để xem đề xuất đặt hàng chi tiết theo nhà cung cấp.</li>
            <li>Chạy lại dự báo sau khi có thêm dữ liệu bán mới (cuối tuần / cuối tháng).</li>
          </ul>
        }
      />
    </div>
  );
}
