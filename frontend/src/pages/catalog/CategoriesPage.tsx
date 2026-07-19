import * as React from 'react';
import { Button, Checkbox, Form, Input, Modal, Select as AntdSelect, Switch, Tabs, message } from 'antd';
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
  moveCategoryItems,
  updateCategory,
} from '@/services/wmsApi';
import type { CategoryDto } from '@/types/api';
import type { PageKey } from '@/types/pages';

type Props = {
  productsList: Product[];
  setPage: (page: PageKey) => void;
  openProduct: (product: Product) => void;
  reloadCatalog?: () => Promise<void>;
};

type MoveMode = 'all' | 'custom';

export default function CategoriesPage({ productsList, setPage, openProduct, reloadCatalog }: Props) {
  const { authUser } = useAuth();
  const role = normalizeRole(authUser?.role);
  const canEdit = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSE'].includes(role);
  const canManageCategoryStatus = ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(role);
  const [rows, setRows] = React.useState<CategoryDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCat, setSelectedCat] = React.useState<CategoryDto | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryDto | null>(null);
  const [moveModalOpen, setMoveModalOpen] = React.useState(false);
  const [moveSourceCat, setMoveSourceCat] = React.useState<CategoryDto | null>(null);
  const [moveMode, setMoveMode] = React.useState<MoveMode>('all');
  const [moveTargetCategoryId, setMoveTargetCategoryId] = React.useState<number | undefined>();
  const [moveAssignments, setMoveAssignments] = React.useState<Record<string, number | undefined>>({});
  const [moveAndDeactivate, setMoveAndDeactivate] = React.useState(true);
  const [movingItems, setMovingItems] = React.useState(false);
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
  const moveProducts = React.useMemo(
    () =>
      moveSourceCat
        ? productsList.filter((p) => p.categoryId === moveSourceCat.id || p.category === moveSourceCat.categoryName)
        : [],
    [moveSourceCat, productsList]
  );
  const targetCategoryOptions = React.useMemo(
    () =>
      rows
        .filter((cat) => cat.active && cat.id !== moveSourceCat?.id)
        .map((cat) => ({ value: cat.id, label: cat.categoryName })),
    [moveSourceCat?.id, rows]
  );

  const resetMoveModal = () => {
    setMoveModalOpen(false);
    setMoveSourceCat(null);
    setMoveMode('all');
    setMoveTargetCategoryId(undefined);
    setMoveAssignments({});
    setMoveAndDeactivate(true);
    setMovingItems(false);
  };

  const openMoveModal = (cat: CategoryDto) => {
    setMoveSourceCat(cat);
    setMoveMode('all');
    setMoveTargetCategoryId(undefined);
    setMoveAssignments({});
    setMoveAndDeactivate(true);
    setMoveModalOpen(true);
  };

  const applyTargetToAllMoveRows = (targetCategoryId?: number) => {
    if (!targetCategoryId) return;
    setMoveAssignments(
      Object.fromEntries(moveProducts.map((product) => [product.key, targetCategoryId]))
    );
  };

  const handleMoveItems = async () => {
    if (!moveSourceCat) return;
    if (targetCategoryOptions.length === 0) {
      message.error('Cần có ít nhất một danh mục đang hoạt động khác để chuyển sản phẩm');
      return;
    }

    if (moveMode === 'all' && !moveTargetCategoryId) {
      message.error('Vui lòng chọn danh mục đích');
      return;
    }

    if (moveMode === 'custom') {
      const missingProduct = moveProducts.find((product) => !moveAssignments[product.key]);
      if (missingProduct) {
        message.error(`Vui lòng chọn danh mục đích cho ${missingProduct.name}`);
        return;
      }
    }

    const payload =
      moveMode === 'all'
        ? {
            targetCategoryId: moveTargetCategoryId,
            deleteSourceAfterMove: moveAndDeactivate,
          }
        : {
            deleteSourceAfterMove: moveAndDeactivate,
            moves: moveProducts.map((product) => ({
              itemId: Number(product.key),
              targetCategoryId: moveAssignments[product.key] as number,
            })),
          };

    setMovingItems(true);
    try {
      const movedCount = await moveCategoryItems(moveSourceCat.id, payload);
      message.success(
        moveAndDeactivate
          ? `Đã chuyển ${movedCount} sản phẩm và ngưng danh mục`
          : `Đã chuyển ${movedCount} sản phẩm`
      );
      resetMoveModal();
      await load();
      await reloadCatalog?.();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Chuyển sản phẩm thất bại');
      setMovingItems(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    
    // Check draft
    try {
      const saved = localStorage.getItem('draft_category_create');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < 300000 && parsed.values) {
          form.setFieldsValue(parsed.values);
          setModalOpen(true);
          return;
        }
      }
    } catch(e) {}

    form.setFieldsValue({ active: true });
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryDto) => {
    setEditing(cat);
    form.setFieldsValue({
      categoryName: cat.categoryName,
      active: cat.active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      categoryName: values.categoryName,
      active: canManageCategoryStatus ? values.active : editing?.active ?? true,
      uomCategories: 'RETAIL,PACKAGE',
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
        localStorage.removeItem('draft_category_create');
      }
      setModalOpen(false);
      await load();
      await reloadCatalog?.();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  };

  const handleDelete = async (cat: CategoryDto) => {
    const productCount = productsList.filter((p) => p.categoryId === cat.id || p.category === cat.categoryName).length;

    if (productCount > 0) {
      openMoveModal(cat);
      return;
    }

    Modal.confirm({
      title: 'Ngưng hoạt động danh mục?',
      content: `Ngừng hoạt động danh mục "${cat.categoryName}"?`,
      okText: 'Ngưng hoạt động',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteCategory(cat.id);
          message.success('Đã ngưng hoạt động danh mục');
          await load();
          await reloadCatalog?.();
        } catch (e) {
          Modal.warning({
            title: 'Không thể ngưng danh mục',
            content:
              e instanceof Error
                ? e.message
                : 'Danh mục đang có sản phẩm hoặc không thể ngưng tại thời điểm này.',
            okText: 'Đã hiểu',
          });
        }
      },
    });
  };

  const handleActivate = async (cat: CategoryDto) => {
    Modal.confirm({
      title: 'Mở lại danh mục?',
      content: `Mở lại danh mục "${cat.categoryName}" để có thể chọn khi tạo hoặc cập nhật sản phẩm?`,
      okText: 'Mở lại',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await updateCategory(cat.id, {
            categoryName: cat.categoryName,
            active: true,
          });
          message.success('Đã mở lại danh mục');
          await load();
          await reloadCatalog?.();
        } catch (e) {
          message.error(e instanceof Error ? e.message : 'Mở lại danh mục thất bại');
        }
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
                    {canManageCategoryStatus &&
                      (cat.active ? (
                        <Button size="small" danger onClick={() => handleDelete(cat)}>
                          Ngưng
                        </Button>
                      ) : (
                        <Button size="small" type="primary" ghost onClick={() => handleActivate(cat)}>
                          Mở lại
                        </Button>
                      ))}
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
        title="Chuyển sản phẩm trước khi ngưng danh mục"
        open={moveModalOpen}
        onCancel={resetMoveModal}
        width={820}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={resetMoveModal}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" danger loading={movingItems} onClick={handleMoveItems}>
            {moveAndDeactivate ? 'Chuyển và ngưng' : 'Chuyển sản phẩm'}
          </Button>,
        ]}
      >
        {moveSourceCat && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Danh mục <strong>{moveSourceCat.categoryName}</strong> đang có{' '}
              <strong>{moveProducts.length}</strong> sản phẩm đang kinh doanh.
            </div>

            <Tabs
              activeKey={moveMode}
              onChange={(key) => setMoveMode(key as MoveMode)}
              items={[
                {
                  key: 'all',
                  label: 'Chuyển tất cả',
                  children: (
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-slate-700">Danh mục đích</label>
                      <AntdSelect
                        showSearch
                        allowClear
                        placeholder="Chọn danh mục nhận sản phẩm"
                        optionFilterProp="label"
                        value={moveTargetCategoryId}
                        options={targetCategoryOptions}
                        onChange={setMoveTargetCategoryId}
                      />
                    </div>
                  ),
                },
                {
                  key: 'custom',
                  label: 'Chuyển từng sản phẩm',
                  children: (
                    <div className="space-y-3">
                      <div className="grid gap-2 rounded-lg border border-line bg-slate-50 p-3 md:grid-cols-[1fr_auto]">
                        <AntdSelect
                          showSearch
                          allowClear
                          placeholder="Chọn danh mục để áp dụng nhanh"
                          optionFilterProp="label"
                          value={moveTargetCategoryId}
                          options={targetCategoryOptions}
                          onChange={setMoveTargetCategoryId}
                        />
                        <Button onClick={() => applyTargetToAllMoveRows(moveTargetCategoryId)}>
                          Áp dụng cho tất cả
                        </Button>
                      </div>

                      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                        {moveProducts.map((product) => (
                          <div
                            key={product.key}
                            className="grid gap-3 rounded-lg border border-line p-3 md:grid-cols-[1fr_280px]"
                          >
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-ink">{product.name}</div>
                              <div className="text-xs text-muted">{product.sku}</div>
                            </div>
                            <AntdSelect
                              showSearch
                              allowClear
                              placeholder="Chọn danh mục đích"
                              optionFilterProp="label"
                              value={moveAssignments[product.key]}
                              options={targetCategoryOptions}
                              onChange={(value) =>
                                setMoveAssignments((current) => ({ ...current, [product.key]: value }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                },
              ]}
            />

            <Checkbox checked={moveAndDeactivate} onChange={(e) => setMoveAndDeactivate(e.target.checked)}>
              Ngưng danh mục "{moveSourceCat.categoryName}" sau khi chuyển
            </Checkbox>
          </div>
        )}
      </Modal>
      <Modal
        title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Lưu"
      >
        <Form 
          form={form} 
          layout="vertical" 
          className="mt-4"
          onValuesChange={(_, allValues) => {
            if (!editing) {
              localStorage.setItem('draft_category_create', JSON.stringify({
                timestamp: Date.now(),
                values: allValues
              }));
            }
          }}
        >
          <Form.Item name="categoryName" label="Tên danh mục" rules={[{ required: true, message: 'Nhập tên danh mục' }]}>
            <Input />
          </Form.Item>
          {editing && canManageCategoryStatus && (
            <Form.Item name="active" label="Đang kinh doanh" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
