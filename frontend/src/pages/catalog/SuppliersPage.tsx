import { Button, Form, Input, InputNumber, Modal, Tag, message as antdMessage } from 'antd';
import { motion } from 'framer-motion';
import { Search, Truck } from 'lucide-react';
import * as React from 'react';
import { AiSummary } from '@/components/ai/AiSummary';
import { Card, StatusChip, UiButton } from '@/components/ui';
import { formatMoney as money, type Product } from '@/lib/itemMapper';
import { normalizeRole } from '@/lib/permissions';
import { fetchSupplierDebtsBySupplier, recordDebtPayment, updateSupplier } from '@/services/wmsApi';
import type { SupplierDebtDto, SupplierDto, UserDto } from '@/types/api';

export default function SuppliersPage({ suppliers, productsList, authUser, reloadCatalog }: { suppliers: SupplierDto[]; productsList: Product[]; authUser?: UserDto; reloadCatalog?: () => Promise<void> }) {
  const [selectedSup, setSelectedSup] = React.useState<SupplierDto | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [debts, setDebts] = React.useState<SupplierDebtDto[]>([]);
  const [debtTab, setDebtTab] = React.useState<'info' | 'debt'>('info');
  const [payAmounts, setPayAmounts] = React.useState<Record<number, number>>({});

  const [searchQuery, setSearchQuery] = React.useState('');
  const canEdit = authUser && ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(normalizeRole(authUser.role));

  const filteredSuppliers = suppliers.filter(s =>
    !searchQuery ||
    s.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.phone && s.phone.includes(searchQuery))
  );

  const handleOpen = (sup: SupplierDto) => {
    setSelectedSup(sup);
    setIsEditing(false);
    setDebtTab('info');
    fetchSupplierDebtsBySupplier(sup.id).then(setDebts).catch(() => setDebts([]));
    form.setFieldsValue({
      supplierName: sup.supplierName,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      active: sup.active,
    });
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedSup) return;

      const isActive = values.active === 'true' || values.active === true;
      values.active = isActive;

      const doUpdate = async () => {
        setLoading(true);
        try {
          await updateSupplier(selectedSup.id, values);
          antdMessage.success('Cập nhật nhà cung cấp thành công');
          setIsEditing(false);
          setSelectedSup(null);
          if (reloadCatalog) await reloadCatalog();
        } catch (e: any) {
          antdMessage.error(e.message || 'Lỗi khi cập nhật');
        } finally {
          setLoading(false);
        }
      };

      if (selectedSup.active && !isActive) {
        Modal.confirm({
          title: 'Xác nhận ngừng hoạt động',
          content: 'Ngừng hoạt động nhà cung cấp này có thể ảnh hưởng đến việc nhập hàng. Bạn có chắc chắn?',
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

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="font-semibold text-lg">Nhà cung cấp đối tác</h2>
          <Input className="w-64" prefix={<Search size={16} />} placeholder="Tìm theo tên, SĐT..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} allowClear />
        </div>
        <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
          {filteredSuppliers.map((sup) => (
            <motion.div whileHover={{ y: -3 }} onClick={() => handleOpen(sup)} className="cursor-pointer rounded-xl border border-line bg-slate-50 p-4 transition-colors hover:bg-slate-100 hover:border-indigo-300" key={sup.id}>
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo">
                  <Truck size={18} />
                </div>
                <StatusChip tone={sup.active ? 'success' : 'warning'}>{sup.active ? 'Hoạt động' : 'Ngưng'}</StatusChip>
              </div>
              <strong className="text-ink text-base">{sup.supplierName}</strong>
              <p className="text-xs text-muted mt-0.5">{sup.contactPerson ?? '—'} · {sup.phone ?? '—'}</p>
              <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                {productsList.length} SKU trong hệ thống
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
      <AiSummary setPage={() => { }} />
      <Modal
        title={isEditing ? 'Sửa thông tin Nhà cung cấp' : `Chi tiết: ${selectedSup?.supplierName}`}
        open={!!selectedSup}
        onCancel={() => { setSelectedSup(null); setIsEditing(false); }}
        footer={
          isEditing ? (
            <div className="flex justify-end gap-2">
              <UiButton variant="secondary" onClick={() => setIsEditing(false)} disabled={loading}>Hủy</UiButton>
              <UiButton variant="primary" onClick={handleUpdate} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</UiButton>
            </div>
          ) : (
            canEdit ? <UiButton variant="primary" onClick={() => setIsEditing(true)}>Chỉnh sửa</UiButton> : null
          )
        }
        forceRender
      >
        {selectedSup && !isEditing && (
          <div className="space-y-3 mt-4 text-sm text-slate-700">
            <div className="flex gap-2 mb-3">
              <Button type={debtTab === 'info' ? 'primary' : 'default'} size="small" onClick={() => setDebtTab('info')}>Thông tin</Button>
              <Button type={debtTab === 'debt' ? 'primary' : 'default'} size="small" onClick={() => setDebtTab('debt')}>Công nợ ({debts.length})</Button>
            </div>
            {debtTab === 'info' ? (
              <>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">Tên NCC:</span><span>{selectedSup.supplierName}</span></div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">Người liên hệ:</span><span>{selectedSup.contactPerson || '—'}</span></div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">SĐT:</span><span>{selectedSup.phone || '—'}</span></div>
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">Email:</span><span>{selectedSup.email || '—'}</span></div>
            <div className="grid grid-cols-[120px_1fr]"><span className="font-semibold text-slate-500">Địa chỉ:</span><span>{selectedSup.address || '—'}</span></div>
              </>
            ) : (
              <div className="space-y-3">
                {debts.length === 0 ? <p className="text-slate-400">Không có công nợ</p> : debts.map((d) => (
                  <div key={d.id} className="border rounded-lg p-3">
                    <div className="flex justify-between"><span>PO #{d.purchaseOrderId}</span><Tag color={d.status === 'PAID' ? 'green' : 'orange'}>{d.status}</Tag></div>
                    <div className="text-xs text-slate-500 mt-1">Tổng: {money(d.amount)} · Đã trả: {money(d.paidAmount)} · Còn: {money(d.remainingAmount)}</div>
                    {d.status !== 'PAID' && canEdit && (
                      <div className="flex gap-2 mt-2">
                        <InputNumber
                          min={1}
                          max={d.remainingAmount}
                          value={payAmounts[d.id] ?? d.remainingAmount}
                          onChange={(v) => setPayAmounts((prev) => ({ ...prev, [d.id]: Number(v) || 0 }))}
                          className="flex-1"
                        />
                        <Button size="small" type="primary" onClick={async () => {
                          const amount = payAmounts[d.id] || d.remainingAmount;
                          try {
                            await recordDebtPayment(d.id, { amount });
                            antdMessage.success('Ghi nhận thanh toán');
                            fetchSupplierDebtsBySupplier(selectedSup!.id).then(setDebts);
                          } catch (e: unknown) {
                            antdMessage.error(e instanceof Error ? e.message : 'Thanh toán thất bại');
                          }
                        }}>Thanh toán</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedSup && isEditing && (
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item name="supplierName" label="Tên nhà cung cấp" rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp' }]}>
              <Input placeholder="Nhập tên" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="contactPerson" label="Người liên hệ">
                <Input placeholder="Tên người đại diện" />
              </Form.Item>
              <Form.Item name="phone" label="Số điện thoại">
                <Input placeholder="Nhập SĐT" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="email" label="Email" className="col-span-2">
                <Input type="email" placeholder="Nhập email" />
              </Form.Item>
            </div>
            <Form.Item name="address" label="Địa chỉ">
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>
            <Form.Item name="active" label="Trạng thái">
              <select className="h-[34px] w-full px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 bg-white">
                <option value="true">Hoạt động</option>
                <option value="false">Ngưng</option>
              </select>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
