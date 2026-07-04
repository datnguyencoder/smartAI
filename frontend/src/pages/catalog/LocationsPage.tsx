import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Search as SearchIcon, Plus } from 'lucide-react';
import { Modal, Form, Input, Button, message } from 'antd';
import { Card, CardHeader, StatusChip , Select } from '@/components/ui';
import type { LocationDto, UserDto } from '@/types/api';
import type { Product } from '@/lib/itemMapper';
import type { PageKey } from '@/types/pages';
import { AiSummary } from '@/components/ai/AiSummary';
import { updateLocation, createLocation } from '@/services/wmsApi';
import { normalizeRole } from '@/lib/permissions';

export default function LocationsPage({
  locations,
  productsList,
  authUser,
  reloadCatalog,
  setPage,
}: {
  locations: LocationDto[];
  productsList: Product[];
  authUser?: UserDto;
  reloadCatalog?: () => Promise<void>;
  setPage?: (page: PageKey) => void;
}) {
  const [selectedLoc, setSelectedLoc] = useState<LocationDto | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  const canEdit = authUser && ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(normalizeRole(authUser.role));

  const handleOpen = (loc: LocationDto) => {
    setSelectedLoc(loc);
    setIsEditing(false);
    form.setFieldsValue({
      locationName: loc.locationName,
      locationType: loc.locationType || 'RACK',
      parentId: loc.parentId,
      active: loc.active,
    });
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedLoc) return;
      
      const isActive = values.active === 'true' || values.active === true;
      values.active = isActive;

      const doUpdate = async () => {
        setLoading(true);
        try {
          await updateLocation(selectedLoc.id, values);
          message.success('Cập nhật vị trí kho thành công');
          setIsEditing(false);
          setSelectedLoc(null);
          if (reloadCatalog) await reloadCatalog();
        } catch (e: any) {
          message.error(e.message || 'Lỗi khi cập nhật vị trí kho');
        } finally {
          setLoading(false);
        }
      };

      if (selectedLoc.active && !isActive) {
        Modal.confirm({
          title: 'Xác nhận vô hiệu hóa',
          content: 'Bạn có chắc chắn muốn ngừng hoạt động kho này? Các thao tác liên quan có thể bị ảnh hưởng.',
          okText: 'Đồng ý',
          cancelText: 'Hủy',
          onOk: doUpdate
        });
      } else {
        doUpdate();
      }
    } catch (e: any) {
      if (e.errorFields) return; // Validation failed
    }
  };

  const filteredLocations = locations.filter(loc => 
    !searchQuery || 
    loc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (loc.locationCode && loc.locationCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="font-semibold text-lg">Danh sách vị trí kho</h2>
          <div className="flex gap-2">
            <Input className="w-64" prefix={<SearchIcon size={16} />} placeholder="Tìm theo tên, mã kho..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} allowClear />
            {canEdit && (
              <Button type="primary" icon={<Plus size={16} />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
                Thêm vị trí
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
          {filteredLocations.map((loc) => (
            <motion.div
              whileHover={{ y: -3 }}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-200"
              key={loc.id}
              onClick={() => handleOpen(loc)}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Building2 size={18} />
                </div>
                <StatusChip tone={loc.active ? 'success' : 'warning'}>
                  {loc.active ? 'Đang hoạt động' : 'Tạm ngưng'}
                </StatusChip>
              </div>
              <strong className="text-slate-800 text-base block mb-1">{loc.locationName}</strong>
              <p className="text-xs text-slate-500 mt-0.5">
                Sức chứa: {loc.capacity ? `${loc.capacity.toLocaleString()}` : 'Không giới hạn'}
              </p>
              <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                Mã kho: {loc.locationCode || `LOC-${loc.id}`}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
      <AiSummary setPage={setPage ?? (() => {})} />

      <Modal
        title={isEditing ? 'Chỉnh sửa Vị trí kho' : 'Chi tiết Vị trí kho'}
        open={!!selectedLoc}
        onCancel={() => {
          setSelectedLoc(null);
          setIsEditing(false);
        }}
        footer={
          isEditing ? (
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsEditing(false)} disabled={loading}>
                Hủy
              </Button>
              <Button type="primary" onClick={handleUpdate} loading={loading}>
                Lưu thay đổi
              </Button>
            </div>
          ) : (
            canEdit ? (
              <Button type="primary" onClick={() => setIsEditing(true)}>
                Chỉnh sửa
              </Button>
            ) : null
          )
        }
      >
        {selectedLoc && !isEditing && (
          <div className="space-y-3 mt-4 text-sm text-slate-700">
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-500">Tên kho:</span>
              <span>{selectedLoc.locationName}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-500">Loại:</span>
              <span>{selectedLoc.locationType || '—'}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-500">Kho cha:</span>
              <span>
                {selectedLoc.parentId
                  ? locations.find((l) => l.id === selectedLoc.parentId)?.locationName || selectedLoc.parentId
                  : '—'}
              </span>
            </div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-500">Mã kho:</span>
              <span>{selectedLoc.locationCode || `LOC-${selectedLoc.id}`}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-500">Sức chứa:</span>
              <span>{selectedLoc.capacity ? `${selectedLoc.capacity.toLocaleString()}` : 'Không giới hạn'}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr]">
              <span className="font-semibold text-slate-500">Trạng thái:</span>
              <StatusChip tone={selectedLoc.active ? 'success' : 'warning'}>
                {selectedLoc.active ? 'Đang hoạt động' : 'Tạm ngưng'}
              </StatusChip>
            </div>
          </div>
        )}

        {selectedLoc && isEditing && (
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item name="parentId" label="Kho cha (Khu vực lớn)">
              <Select disabled getPopupContainer={(trigger) => trigger.parentNode}>
                <option value={selectedLoc.parentId}>{selectedLoc.parentId ? locations.find((l) => l.id === selectedLoc.parentId)?.locationName || selectedLoc.parentId : 'Không có'}</option>
              </Select>
            </Form.Item>
            <Form.Item
              name="locationName"
              label="Tên kho"
              rules={[{ required: true, message: 'Vui lòng nhập tên kho' }]}
            >
              <Input placeholder="Ví dụ: Kệ A1" />
            </Form.Item>
            <Form.Item name="locationType" label="Loại kho">
              <select className="h-[34px] w-full px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 bg-white">
                <option value="ZONE">Khu vực (ZONE)</option>
                <option value="RACK">Kệ (RACK)</option>
                <option value="BIN">Ô (BIN)</option>
              </select>
            </Form.Item>
            <Form.Item name="active" label="Trạng thái">
              <select className="h-[34px] w-full px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500 bg-white">
                <option value="true">Đang hoạt động</option>
                <option value="false">Tạm ngưng</option>
              </select>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="Thêm vị trí kho"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={async () => {
          const values = await createForm.validateFields();
          setLoading(true);
          try {
            await createLocation(values);
            message.success('Đã tạo vị trí kho');
            setCreateOpen(false);
            if (reloadCatalog) await reloadCatalog();
          } catch (e: any) {
            message.error(e.message || 'Tạo thất bại');
          } finally {
            setLoading(false);
          }
        }}
        okText="Tạo"
        confirmLoading={loading}
      >
        <Form form={createForm} layout="vertical" className="mt-4">
          <Form.Item name="locationName" label="Tên vị trí" rules={[{ required: true }]}>
            <Input placeholder="Kệ A1" />
          </Form.Item>
          <Form.Item name="locationType" label="Loại" initialValue="RACK">
            <select className="h-[34px] w-full rounded-md border border-slate-200 px-3 text-sm">
              <option value="ZONE">Khu vực (ZONE)</option>
              <option value="RACK">Kệ (RACK)</option>
              <option value="BIN">Ô (BIN)</option>
            </select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
