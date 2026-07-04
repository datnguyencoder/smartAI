import { Button, Form, Input, Modal, Table, Tag, message as antdMessage } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader , Select } from '@/components/ui';
import { createUser, fetchUsers, lockUser, softDeleteUser, unlockUser, updateUser } from '@/services/wmsApi';
import type { Role, UserDto, UserStatus } from '@/types/api';

const userFormValidateMessages = {
  required: 'Vui lòng nhập ${label}',
  types: {
    email: '${label} không đúng định dạng',
  },
  string: {
    min: '${label} phải có ít nhất ${min} ký tự',
    max: '${label} không được vượt quá ${max} ký tự',
  },
};

export default function UsersPage() {
  const [users, setUsers] = React.useState<UserDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserDto | null>(null);
  const [form] = Form.useForm();

  const loadUsers = React.useCallback(() => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch((e) => antdMessage.error(e instanceof Error ? e.message : 'Không tải được danh sách người dùng'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: 'ROLE_STAFF' });
    setModalOpen(true);
  };

  const openEdit = (user: UserDto) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingUser) {
        const fullName = values.fullName?.trim();
        const email = values.email?.trim();

        await updateUser(editingUser.id, {
          fullName: fullName || undefined,
          email: email || undefined,
        });
        antdMessage.success('Cập nhật người dùng thành công');
      } else {
        await createUser({
          username: values.username.trim(),
          password: values.password,
          email: values.email.trim(),
          fullName: values.fullName?.trim() || undefined,
          role: values.role,
        });
        antdMessage.success('Tạo người dùng thành công');
      }
      setModalOpen(false);
      loadUsers();
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : 'Thao tác thất bại');
    }
  };

  const statusTag = (status: UserStatus) => {
    if (status === 'ACTIVE') return <Tag color="green">ACTIVE</Tag>;
    if (status === 'LOCKED') return <Tag color="orange">LOCKED</Tag>;
    return <Tag color="red">INACTIVE</Tag>;
  };

  const roleText = (role: Role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'ADMIN';
      case 'ROLE_MANAGER':
        return 'QUẢN LÝ';
      case 'ROLE_STAFF':
        return 'THU NGÂN';
      case 'ROLE_WAREHOUSE':
        return 'KHO';
      case 'ROLE_ANALYST':
        return 'PHÂN TÍCH';
    }
  };
  const columns: ColumnsType<UserDto> = [
    { title: 'Tên đăng nhập', dataIndex: 'username' },
    { title: 'Họ tên', dataIndex: 'fullName' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Vai trò', dataIndex: 'role', render: roleText },
    { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
    {
      title: 'Thao tác',
      render: (_, user) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => openEdit(user)}>Sửa</Button>
          <Button
            size="small"
            danger
            disabled={user.status === 'LOCKED' || user.status === 'INACTIVE'}
            onClick={() => {
              Modal.confirm({
                title: 'Khóa tài khoản?',
                content: `Bạn muốn khóa ${user.username}?`,
                onOk: async () => {
                  try {
                    await lockUser(user.id);
                    antdMessage.success('Khóa tài khoản thành công');
                    loadUsers();
                  } catch (e) {
                  antdMessage.error(e instanceof Error ? e.message : 'Không thể khóa tài khoản');
                  }
                },
              });
            }}
          >
            Khóa
          </Button>
          <Button
            size="small"
            disabled={user.status !== 'LOCKED'}
            onClick={() => {
              Modal.confirm({
                title: 'Mở khóa tài khoản?',
                content: `Bạn muốn mở khóa ${user.username}?`,
                onOk: async () => {
                  await unlockUser(user.id);
                  antdMessage.success('Mở khóa tài khoản thành công');
                  loadUsers();
                },
          });
    }}
>
  Mở khóa
</Button>
          <Button
            size="small"
            danger
            disabled={user.status !== 'LOCKED'}
            onClick={() => {
              Modal.confirm({
                title: 'Xóa mềm tài khoản?',
                content: 'Backend yêu cầu tài khoản phải LOCKED trước khi chuyển sang INACTIVE.',
                onOk: async () => {
                  await softDeleteUser(user.id);
                  antdMessage.success('Xóa mềm thành công');
                  loadUsers();
                },
              });
            }}
          >
            Xóa mềm
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Người dùng hệ thống"
        description="Admin tạo tài khoản, cập nhật vai trò, khóa và xóa mềm nhân sự."
        action={<Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Tạo mới</Button>}
      />

      <div className="px-5 pb-5">
        <Table rowKey="id" loading={loading} dataSource={users} columns={columns} />
      </div>

      <Modal
        title={editingUser ? 'Sửa thông tin' : 'Thêm người dùng mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingUser ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        forceRender
      >
        <Form form={form} layout="vertical" validateMessages={userFormValidateMessages}>
          {!editingUser && (
            <>
              <Form.Item name="username" label="Tên đăng nhập" messageVariables={{ label: 'tên đăng nhập' }} rules={[{ required: true }, { min: 4 }, { max: 50 }, { pattern: /^[a-zA-Z0-9_.]+$/, message: 'Tên đăng nhập chỉ được chứa chữ, số và gạch dưới hoặc dấu chấm' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Mật khẩu" messageVariables={{ label: 'mật khẩu' }} rules={[{ required: true }, { min: 6 }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}

          <Form.Item name="fullName" label="Họ tên" messageVariables={{ label: 'họ tên' }} rules={[{ max: 100 }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            messageVariables={{ label: 'email' }}
            rules={[
              ...(!editingUser ? [{ required: true }] : []),
              { type: 'email' },
            ]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="role"
              label="Vai trò"
              messageVariables={{ label: 'vai trò' }}
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'ROLE_ADMIN' satisfies Role, label: 'Admin' },
                  { value: 'ROLE_MANAGER' satisfies Role, label: 'Quản lý' },
                  { value: 'ROLE_STAFF' satisfies Role, label: 'Thu ngân' },
                  { value: 'ROLE_WAREHOUSE' satisfies Role, label: 'Kho' },
                  { value: 'ROLE_ANALYST' satisfies Role, label: 'Phân tích' },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
