import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

// Local API 单例入口（开发文档 §2「数据访问」/ 开发计划 M1-4）。
// Server Component、Route Handler、seed 脚本统一经此直连数据库读写，
// 无 HTTP 跳转、类型安全。getPayload 已在模块作用域缓存实例，重复调用不重复初始化。
export const getPayloadClient = async (): Promise<Payload> => getPayload({ config })
