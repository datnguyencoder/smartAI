import * as React from 'react';
import { Button, Checkbox, message, Table } from 'antd';
import { Printer } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { downloadBarcodeLabel } from '@/services/wmsApi';
import type { Product } from '@/lib/itemMapper';

type Props = { productsList: Product[] };

export default function BarcodePrintPage({ productsList }: Props) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [printing, setPrinting] = React.useState(false);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(productsList.map((p) => p.key)) : new Set());
  };

  const handlePrint = async () => {
    if (selected.size === 0) {
      message.warning('Chọn ít nhất 1 sản phẩm');
      return;
    }
    setPrinting(true);
    try {
      const win = window.open('', '_blank');
      if (!win) {
        message.error('Trình duyệt chặn cửa sổ in');
        return;
      }
      const svgs: string[] = [];
      for (const key of selected) {
        const blob = await downloadBarcodeLabel(Number(key));
        const text = await blob.text();
        svgs.push(text);
      }
      win.document.write(`<!DOCTYPE html><html><head><title>In ma vach</title>
        <style>body{margin:0;padding:8px;display:flex;flex-wrap:wrap;gap:8px;}
        .label{page-break-inside:avoid;}</style></head><body>
        ${svgs.map((s) => `<div class="label">${s}</div>`).join('')}
        <script>window.onload=()=>{setTimeout(()=>window.print(),300);}</script>
        </body></html>`);
      win.document.close();
      message.success(`Đã gửi ${selected.size} nhãn in`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'In mã vạch thất bại');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="In mã vạch sản phẩm"
        description="Chọn sản phẩm và in nhãn mã vạch hàng loạt."
        action={
          <Button type="primary" icon={<Printer size={16} />} loading={printing} onClick={handlePrint}>
            In đã chọn ({selected.size})
          </Button>
        }
      />
      <Table
        rowKey="key"
        dataSource={productsList}
        pagination={{ pageSize: 20 }}
        columns={[
          {
            title: (
              <Checkbox
                checked={selected.size === productsList.length && productsList.length > 0}
                indeterminate={selected.size > 0 && selected.size < productsList.length}
                onChange={(e) => toggleAll(e.target.checked)}
              />
            ),
            width: 48,
            render: (_: unknown, row: Product) => (
              <Checkbox checked={selected.has(row.key)} onChange={() => toggle(row.key)} />
            ),
          },
          { title: 'Mã SKU', dataIndex: 'sku', width: 140 },
          { title: 'Tên sản phẩm', dataIndex: 'name' },
          {
            title: 'Giá bán',
            dataIndex: 'price',
            align: 'right',
            render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ`,
          },
        ]}
      />
    </Card>
  );
}
