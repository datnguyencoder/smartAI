import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, InputNumber, message, Card, Typography, Space, Divider, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { fetchLocations, fetchItems, fetchInventory, createScrapOrder } from '@/services/wmsApi';
import type { LocationDto, ItemDto, InventoryItemDto } from '@/types/api';

const { Title, Text } = Typography;

export default function ScrapOrderCreatePage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [items, setItems] = useState<ItemDto[]>([]);
  const [inventory, setInventory] = useState<InventoryItemDto[]>([]);

  useEffect(() => {
    Promise.all([
      fetchLocations(),
      fetchItems(),
      fetchInventory(),
    ])
      .then(([locsRes, itemsRes, invRes]) => {
        setLocations(locsRes || []);
        setItems(itemsRes || []);
        setInventory(invRes || []);
      })
      .catch((err) => message.error('Lỗi tải dữ liệu cơ sở: ' + err.message));
  }, []);

  const selectedLocationId = Form.useWatch('locationId', form);

  // Derive unique items available in the selected location
  const availableInventoryInLocation = inventory.filter(
    (inv) => inv.locationId === selectedLocationId && inv.availableQuantity > 0
  );
  const uniqueAvailableItemIds = Array.from(new Set(availableInventoryInLocation.map(inv => inv.itemId)));
  const availableItems = items.filter(item => uniqueAvailableItemIds.includes(item.id));

  const onFinish = async (values: any) => {
    if (!values.items || values.items.length === 0) {
      message.error('Vui lòng thêm ít nhất một mặt hàng để hủy');
      return;
    }
    
    // Fast fail local validation based on specifically chosen lot/inventory
    for (const item of values.items) {
      const invLine = inventory.find(i => i.id === item.inventoryId);
      if (!invLine) {
        message.error('Vui lòng chọn lô hàng cho tất cả sản phẩm!');
        return;
      }
      if (item.quantity > invLine.availableQuantity) {
        message.error(`Số lượng xuất hủy của "${invLine.itemName}" (${item.quantity}) vượt quá tồn khả dụng (${invLine.availableQuantity}) của lô đã chọn!`);
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        locationId: values.locationId,
        items: values.items.map((it: any) => {
          const invLine = inventory.find(inv => inv.id === it.inventoryId);
          return {
            itemId: it.itemId,
            lotId: invLine?.lotId,
            quantity: it.quantity,
            reason: it.reason,
          };
        }),
      };
      await createScrapOrder(payload);
      message.success('Gửi yêu cầu hủy hàng thành công!');
      navigate('/scrap-orders');
    } catch (error: any) {
      message.error(error.message || 'Lỗi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="locationId"
            label="Kho xuất hủy"
            rules={[{ required: true, message: 'Vui lòng chọn kho' }]}
            getValueFromEvent={(e) => Number(e.target.value)}
            getValueProps={(val) => ({ value: val || "" })}
          >
            <select
              className="w-full h-8 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:border-primary"
            >
              <option value="" disabled hidden>Chọn kho...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.locationName}</option>
              ))}
            </select>
          </Form.Item>

          <Divider orientation="left">Danh sách mặt hàng</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card size="small" className="mb-4 bg-gray-50" key={key}>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'itemId']}
                          label="Sản phẩm"
                          rules={[{ required: true, message: 'Chọn sản phẩm' }]}
                          getValueFromEvent={(e) => {
                            const selectedItemId = Number(e.target.value);
                            const lots = availableInventoryInLocation.filter(inv => inv.itemId === selectedItemId);
                            if (lots.length === 1) {
                              form.setFieldValue(['items', name, 'inventoryId'], lots[0].id);
                            } else {
                              form.setFieldValue(['items', name, 'inventoryId'], undefined);
                            }
                            return selectedItemId;
                          }}
                          getValueProps={(val) => ({ value: val || "" })}
                        >
                          <select
                            className="w-full h-8 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:border-primary disabled:bg-slate-100 disabled:text-slate-400"
                            disabled={!selectedLocationId || availableItems.length === 0}
                          >
                            {!selectedLocationId ? (
                              <option value="" disabled hidden>Vui lòng chọn kho trước</option>
                            ) : availableItems.length === 0 ? (
                              <option value="" disabled hidden>Không có hàng</option>
                            ) : (
                              <option value="" disabled hidden>Chọn sản phẩm</option>
                            )}
                            {availableItems.map(item => (
                              <option key={item.id} value={item.id}>{item.itemCode} - {item.itemName}</option>
                            ))}
                          </select>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues.items?.[name]?.itemId !== currentValues.items?.[name]?.itemId ||
                            prevValues.locationId !== currentValues.locationId
                          }
                        >
                          {() => {
                            const currentItemId = form.getFieldValue(['items', name, 'itemId']);
                            const availableLots = availableInventoryInLocation.filter(inv => inv.itemId === currentItemId);
                            return (
                              <Form.Item
                                {...restField}
                                name={[name, 'inventoryId']}
                                label="Lô hàng"
                                rules={[{ required: true, message: 'Chọn lô hàng' }]}
                                getValueFromEvent={(e) => Number(e.target.value)}
                                getValueProps={(val) => ({ value: val || "" })}
                              >
                                <select
                                  className="w-full h-8 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:border-primary disabled:bg-slate-100 disabled:text-slate-400"
                                  disabled={!currentItemId || availableLots.length === 0}
                                >
                                  {!currentItemId ? (
                                    <option value="" disabled hidden>Chọn sản phẩm trước</option>
                                  ) : availableLots.length === 0 ? (
                                    <option value="" disabled hidden>Không có lô hàng</option>
                                  ) : (
                                    <option value="" disabled hidden>Chọn lô hàng</option>
                                  )}
                                  {availableLots.map(lot => (
                                    <option key={lot.id} value={lot.id}>
                                      {lot.lotNumber ? `Lô: ${lot.lotNumber}` : 'Mặc định'} (Tồn: {lot.availableQuantity})
                                    </option>
                                  ))}
                                </select>
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Số lượng"
                          rules={[{ required: true, message: 'Nhập số lượng' }]}
                        >
                          <InputNumber min={0.01} style={{ width: '100%' }} placeholder="SL" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'reason']}
                          label="Lý do hủy"
                          rules={[{ required: true, message: 'Nhập lý do' }]}
                        >
                          <Input placeholder="VD: Sữa cận date, lon móp..." />
                        </Form.Item>
                      </Col>
                      <Col span={2} className="flex items-center justify-center pt-6">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm mặt hàng
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item className="mt-6 flex justify-end">
            <Space>
              <Button onClick={() => navigate('/scrap-orders')}>Hủy thao tác</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Gửi yêu cầu loại bỏ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
