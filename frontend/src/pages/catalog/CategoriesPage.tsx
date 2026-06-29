import * as React from 'react';
import { Button, Form, Input, Modal, Select, Switch, message } from 'antd';
import { motion } from 'framer-motion';
import { Plus, Search, Tags } from 'lucide-react';
import { AiSummary } from '@/components/ai/AiSummary';
import { ProductsTable } from '@/components/catalog/ProductsTable';
import { Card, StatusChip } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/permissions';
import type { Product } from '@/lib/itemMapper';
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '@/services/wmsApi';
import type { CategoryDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

const UOM_CATEGORY_OPTIONS = [
  { value: 'COUNT', label: 'Số lượng' },
  { value: 'WEIGHT', label: 'Khối lượng' },
  { value: 'VOLUME', label: 'Dung tích' },
  { value: 'PACKAGE', label: 'Đóng gói' },
  { value: 'LENGTH', label: 'Chiều dài' },
  { value: 'OTHER', label: 'Khác' },
];

function splitUomCategories(value?: string) {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
}

type Props = {
  productsList: Product[];
  setPage: (page: PageKey) => void;
  openProduct: (product: Product) => void;
  reloadCatalog?: () => Promise<void>;
};

export default function CategoriesPage({ productsList, setPage, openProduct, reloadCatalog }: Props) {
  const { authUser } = useAuth();
  const canEdit = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSE'].includes(normalizeRole(authUser?.role));
  const [rows, setRows] = React.useState<CategoryDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCat, setSelectedCat] = React.useState<CategoryDto | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryDto | null>(null);
  const [form] = Form.useForm();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setRows(data ?? []);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không tải danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter(
    (c) => !searchQuery || c.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ active: true, uomCategories: ['COUNT', 'PACKAGE'] });
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryDto) => {
    setEditing(cat);
    form.setFieldsValue({
      categoryName: cat.categoryName,
      active: cat.active,
      uomCategories: splitUomCategories(cat.uomCategories),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      categoryName: values.categoryName,
      active: values.active,
      uomCategories: Array.isArray(values.uomCategories)
        ? values.uomCategories.join(',')
        : values.uomCategories,
    };

    try {
      if (editing) {
        await updateCategory(editing.id, payload);
        message.success('Cập nhật danh mục thành công');
      } else {
        await createCategory({
          categoryName: payload.categoryName,
          uomCategories: payload.uomCategories,
        });
        message.success('Tạo danh mục thành công');
      }
      setModalOpen(false);
      await load();
      await reloadCatalog?.();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  };

  const handleDelete = async (cat: CategoryDto) => {
    Modal.confirm({
      title: 'Xóa danh mục?',
      content: `Ngừng hoạt động danh mục "${cat.categoryName}"?`,
      okText: 'Xóa',
      okType: 'danger',
      onOk: async () => {
        await deleteCategory(cat.id);
        message.success('Đã xóa danh mục');
        await load();
        await reloadCatalog?.();
      },
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-semibold">Danh mục hàng hóa</h2>
          <div className="flex gap-2">
            <Input
              className="w-52"
              prefix={<Search size={16} />}
              placeholder="Tìm danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
            {canEdit && (
              <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
                Thêm
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
          {loading && <p className="text-muted col-span-2 text-sm">Đang tải…</p>}
          {filtered.map((cat) => {
            const count = productsList.filter((p) => p.category === cat.categoryName).length;
            return (
              <motion.div
                key={cat.id}
                whileHover={{ y: -3 }}
                className="cursor-pointer rounded-xl border border-line bg-slate-50 p-4 transition-colors hover:bg-slate-100"
                onClick={() => setSelectedCat(cat)}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-primary">
                    <Tags size={18} />
                  </div>
                  <StatusChip tone={cat.active ? 'success' : 'warning'}>
                    {cat.active ? 'Đang bán' : 'Ngưng'}
                  </StatusChip>
                </div>
                <strong className="text-base text-ink">{cat.categoryName}</strong>
                <p className="mt-1 text-sm text-muted">{count} sản phẩm</p>
                {canEdit && (
                  <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="small" onClick={() => openEdit(cat)}>
                      Sửa
                    </Button>
                    <Button size="small" danger onClick={() => handleDelete(cat)}>
                      Xóa
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>
      <AiSummary setPage={setPage} />
      <Modal
        title={`Sản phẩm: ${selectedCat?.categoryName}`}
        open={!!selectedCat}
        onCancel={() => setSelectedCat(null)}
        footer={null}
        width={900}
      >
        {selectedCat && (
          <ProductsTable
            title=""
            rows={productsList.filter((p) => p.category === selectedCat.categoryName)}
            openProduct={openProduct}
          />
        )}
      </Modal>
      <Modal
        title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Lưu"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="categoryName" label="Tên danh mục" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="uomCategories"
            label="Nhóm đơn vị được dùng"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một nhóm đơn vị' }]}
          >
            <Select mode="multiple" options={UOM_CATEGORY_OPTIONS} placeholder="Chọn nhóm đơn vị" />
          </Form.Item>
          {editing && (
            <Form.Item name="active" label="Đang kinh doanh" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
