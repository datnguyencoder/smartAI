import { Button, InputTable, Tag, message as antdMessage } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import * as React from 'react';
import { Card , Select } from '@/components/ui';
import {
  fetchAuditLogActions,
  searchAuditLogs,
} from '@/services/wmsApi';
import type { AuditLogDto } from '@/types/api';
import {
  AuditDataBlock,
  auditModuleOptions,
  formatAuditAction,
  formatAuditModule,
} from '@/pages/admin/auditHelpers';

export default function AuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLogDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  const [action, setAction] = React.useState<string | undefined>();
  const [username, setUsername] = React.useState<string | undefined>();
  const [entityType, setEntityType] = React.useState<string | undefined>();
  const [actionOptions, setActionOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
  fetchAuditLogActions(entityType)
    .then(setActionOptions)
    .catch(() => setActionOptions([]));
}, [entityType]);

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchAuditLogs({
        entityType,
        action,
        username,
        page,
        size,
  });
      setLogs(res.content);
      setTotal(res.totalElements);
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Không tải được nhật ký hệ thống');
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, action, username, entityType]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const columns: ColumnsType<AuditLogDto> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleString('vi-VN'),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      render: (value: string) => <Tag color="blue">{formatAuditAction(value)}</Tag>,
    },
    {
      title: 'Phân hệ',
      dataIndex: 'entityType',
      render: (value?: string | null) => formatAuditModule(value),
    },
    {
      title: 'Người thao tác',
      dataIndex: 'username',
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Chi tiết',
      dataIndex: 'detail',
      render: (value?: string) => value || '-',
    },
    {
      title: 'Thay đổi',
      render: (_, row) => (
        <div className="space-y-3 text-xs">
          <AuditDataBlock title="Trước" value={row.beforeData} />
          <AuditDataBlock title="Sau" value={row.afterData} />
        </div>
      ),
    },
  ];

  const resetFilters = () => {
    setAction(undefined);
    setUsername(undefined);
    setEntityType(undefined);
    setPage(0);
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line p-5">
        <h2 className="text-lg font-bold text-ink">Nhật ký hệ thống</h2>
        <p className="text-sm text-slate-500">
          Theo dõi các thao tác quan trọng như đăng nhập, tạo người dùng, cập nhật trạng thái và thay đổi dữ liệu.
        </p>
      </div>

      <div className="grid gap-3 border-b border-line p-5 md:grid-cols-3">
        <Select
          allowClear
          showSearch
          placeholder="Phân hệ"
          value={entityType}
          optionFilterProp="label"
          onChange={(value) => {
            setEntityType(value);
            setAction(undefined);
            setPage(0);
          }}
          options={auditModuleOptions}
        />

        <Select
          allowClear
          showSearch
          placeholder="Hành động"
          value={action}
          optionFilterProp="label"
          onChange={(value) => {
            setAction(value);
            setPage(0);
          }}
          options={actionOptions.map((item) => ({
            value: item,
            label: formatAuditAction(item),
          }))}
        />

        <Input
          placeholder="Người thao tác"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value || undefined);
            setPage(0);
          }}
        />
      </div>

      <div className="flex justify-end gap-2 px-5 py-3">
        <Button onClick={resetFilters}>Xóa lọc</Button>
        <Button type="primary" onClick={loadLogs}>Tải lại</Button>
      </div>

      <div className="px-5 pb-5">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={logs}
          columns={columns}
          pagination={{
            current: page + 1,
            pageSize: size,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage - 1);
              setSize(nextSize);
            },
          }}
        />
      </div>
    </Card>
  );
}
