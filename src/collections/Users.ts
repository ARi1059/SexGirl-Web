import type { CollectionConfig } from 'payload'
import { isAdmin, isSuperAdmin } from '../access/roles'

// 管理员账号（Payload 内置鉴权）。多管理员 + 超管，详见开发文档 §8.1.1。
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  labels: { singular: '管理员', plural: '管理员' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'role'], group: '系统' },
  access: {
    admin: isAdmin, // 谁能进入 /admin
    read: isAdmin,
    create: isSuperAdmin,
    delete: isSuperAdmin,
    // 超管可改全部；普通管理员仅能改自己
    update: ({ req }) => (isSuperAdmin({ req }) ? true : { id: { equals: req.user?.id } }),
  },
  hooks: {
    // 第一个注册的账号自动成为超管，避免“无人能管账号”的死锁
    beforeChange: [
      async ({ req, operation, data }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users' })
          if (totalDocs === 0) data.role = 'superadmin'
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [
        { label: '管理员', value: 'admin' },
        { label: '超级管理员', value: 'superadmin' },
      ],
      // 仅超管可改角色，防止管理员自我提权
      access: { update: ({ req }) => (req.user as { role?: string } | null | undefined)?.role === 'superadmin' },
    },
  ],
}
