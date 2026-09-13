import { defineConfig } from 'wxt';
import { copyRuntimeData } from './scripts/copy-runtime-data.mjs';

// 大数据 JSON 不进 JS chunk：buildStart 时按 scripts/copy-runtime-data.mjs
// 的唯一清单拷入 public/，随扩展以静态资源发布，运行时
// 由后台读取并缓存到 storage。此前静态 import 让 background /
// content / popup 三个入口各抄一份，产物膨胀到 4 MB，CWS 上传 zip 也跟着翻倍。
function officialJsonPlugin() {
  return {
    name: 'feedsieve-copy-official-json',
    buildStart() {
      copyRuntimeData();
    },
  };
}

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // Chrome 和 Firefox 都发布 MV3，避免 WXT 对 Firefox 默认回退到 MV2。
  manifestVersion: 3,
  manifest: (env) => {
    const isFirefox = env.browser === 'firefox';
    return {
      name: 'FeedSieve',
      short_name: 'FeedSieve',
      description: 'X 赛博清洁工：黄框标注垃圾账号，一键批量真拉黑。标注永不隐藏内容。',
      // sidePanel 是 Chromium 专属权限；Firefox 的 sidebar_action 不需要同名权限。
      permissions: isFirefox ? ['storage'] : ['storage', 'sidePanel'],
      host_permissions: [
        'https://x.com/*',
        // dev 模式放行本地社区 API（wrangler dev）；生产构建不包含 localhost。
        ...(env.mode === 'development' ? ['http://localhost/*'] : []),
        // 社区名单下载 + 用户黑白名单同步（Cloudflare Worker，自部署见 apps/community-api）
        'https://feedsieve-api.chendahuang.com/*',
      ],
      icons: {
        16: '/icon-16.png',
        32: '/icon-32.png',
        48: '/icon-48.png',
        64: '/icon.png',
        128: '/icon-128.png',
      },
      ...(isFirefox
        ? {
            browser_specific_settings: {
              gecko: {
                id: 'feedsieve@chendahuang.com',
                // Firefox 140 起原生展示数据传输同意；项目设置内仍可随时关闭名单上传。
                strict_min_version: '140.0',
                data_collection_permissions: {
                  required: ['personallyIdentifyingInfo', 'websiteActivity', 'websiteContent'],
                },
              },
            },
          }
        : {}),
    };
  },
  vite: (env) => ({
    plugins: [officialJsonPlugin()],
    define: {
      // dev/本地测试 API 覆盖：只在 development 构建生效（FEEDSIEVE_API_BASE=http://localhost:8787 pnpm dev）。
      // 生产构建恒为空字符串回退官方线上实例——pack-store 的 manifest 审计查不到
      // 代码内嵌地址，任何环境变量泄漏进生产 zip 都会静默指向错误 API，故此处必须按 mode 隔离。
      __FEEDSIEVE_API_BASE__: JSON.stringify(
        env.mode === 'development' ? (process.env.FEEDSIEVE_API_BASE ?? '') : '',
      ),
    },
  }),
  zip: {
    name: 'feedsieve',
  },
});
