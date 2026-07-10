
# AICP JS Engin 开发手册

## 目录结构

```
.
├── README.MD
├── demo.html                        # 演示页面（输入框 + 输出容器）
└── aicp-core/
    ├── aicp-core.js                 # 主入口（AICP 类、单例）
    ├── aicp-config.js               # 配置管理（localStorage 持久化）
    ├── core/
    │   ├── agent.js                 # Agent 容器（动态属性注入）
    │   ├── envelop.js               # Envelop 消息信封（含 trace_id / ttl / path_history）
    │   ├── registry.js              # 插件注册表（receiver → handler）
    │   └── router.js                # 路由引擎（TTL 校验 + 超时控制）
    └── plugins/
        ├── llm.js                   # LLM 插件（chat / chatStream）
        └── runner.js                # 代码执行插件（runner/exec，沙箱 + 重试）
```

---

## 核心架构

### 1. 消息信封（Envelop）
所有通信基于统一信封，包含 `sender`、`receiver`、`intent`、`payload`、`trace_id`、`message_id`、`channel_id`、`ttl`、`meta`、`path_history` 等字段，支持 JSON 序列化与反序列化。

### 2. 插件注册中心（Registry）
按 `receiver` 字符串注册处理器（如 `llm/chat`、`runner/exec`），支持注册、查询、注销、清空、计数。

### 3. 路由引擎（Router）
- 校验 `receiver` 与 `ttl`，防止死循环
- 超时控制（默认 300s）
- 统一返回 `{ ok, data, error }` 结构
- 自动追踪 `path_history`

### 4. Agent 容器
动态属性注入，`get / set / has` API，承载配置（apiKey、baseUrl、model 等）。

### 5. LLM 插件
- `llm/chat`：标准对话
- `llm/chatStream`：流式对话（返回 `ReadableStream`）

### 6. Runner 执行插件（`runner/exec`）
- 构造 System Prompt，要求 LLM 输出 ```js 代码块
- 解析容器（DOM 元素 / 选择器 / null）
- 自动读取容器尺寸，注入 `__aicp_container__`、`__aicp_width__`、`__aicp_height__`
- 沙箱白名单：`document / console / fetch / Math / Date / JSON / setTimeout / requestAnimationFrame` 等
- 多轮迭代（`maxIter`），错误自动重试，把异常回灌给 LLM 修正
- 支持 `onStart / onDone / onError / onRetry` 回调

### 7. 配置管理（Config）
通过 `localStorage` 持久化 `apiKey / baseUrl / model / maxIter / temperature`，首次运行通过 `prompt()` 引导填写。

---

## 安装使用

无需安装任何依赖。项目使用浏览器原生 ES Modules，**直接用静态服务器打开 `demo.html` 即可**。

### 启动方式

 挂载任何静态页面服务器

### 首次运行

页面打开后会弹出 `prompt()` 引导配置：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| API Key | （必填） | OpenAI 兼容协议的 Key |
| Base URL | `https://gpt-agent.cc/v1` | API 入口 |
| 模型 | `doubao-seed-2.0-code` | 支持任意 OpenAI 兼容模型 |
| 最大重试 | `5` | 代码执行失败时的最大迭代次数 |
| 温度 | `0.1` | 0~1，越低越稳定 |

配置写入 `localStorage`，刷新后无需重复填写，本地浏览器

推荐Coding类型模型，其他类型模型不推荐



---


## API 说明

### `aicp.send(receiver, payload, intent?)`

主入口，向指定 receiver 发送消息。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `receiver` | `string` | 目标插件标识，如 `llm/chat`、`runner/exec` |
| `payload` | `object` | 消息体 |
| `intent` | `string` | 可选，意图标识 |

**返回**：`Promise<{ ok: boolean, data?: any, error?: string }>`

---

### `Config`

```javascript
import { Config } from '/aicp-core/aicp-core.js';

Config.load();                          // 从 localStorage 读取
Config.save({ apiKey, baseUrl, ... });  // 保存
Config.clear();                          // 清空
Config.prompt(savedConfig);             // 弹窗引导填写
```

---

### 内置 Receiver 列表

| Receiver | 用途 | Payload 字段 |
| --- | --- | --- |
| `llm/chat` | 标准 LLM 对话 | `messages`, `model`, `temperature` |
| `llm/chatStream` | 流式 LLM 对话 | `messages`, `model`, `temperature` |
| `runner/exec` | 代码生成 + 沙箱执行 | `messages`, `container`, `width`, `height`, `maxIter`, `onStart`, `onDone`, `onError`, `onRetry` |

### 硬件插件（需 [AICP Shell](https://github.com/woozheng/aicp_shell) 环境）

当页面运行在 AICP Shell 中时，`hardware.js` 自动注册 22 个硬件能力。Shell 环境不可用时跳过注册，不影响核心功能。

| Receiver | 用途 | Payload 字段 |
| --- | --- | --- |
| `hw/camera/take` | 拍照 | — |
| `hw/camera/gallery` | 从相册选择 | — |
| `hw/scanner/scan` | 扫码 | — |
| `hw/gps/locate` | 获取位置 | — |
| `hw/bluetooth/scan` | 开始蓝牙扫描 | — |
| `hw/bluetooth/devices` | 获取蓝牙设备列表 | — |
| `hw/bluetooth/connect` | 连接蓝牙设备 | `address` |
| `hw/audio/record` | 开始录音 | — |
| `hw/audio/play` | 播放音频 | `path` |
| `hw/fs/list` | 列出目录 | `path` |
| `hw/fs/read` | 读取文件 | `path` |
| `hw/fs/write` | 写入文件 | `path`, `content` |
| `hw/fs/delete` | 删除文件 | `path` |
| `hw/process/shell` | 执行命令 | `cmd` |
| `hw/process/open` | 打开应用/文件 | `target` |
| `hw/system/notify` | 发送通知 | `title`, `body` |
| `hw/system/vibrate` | 震动 | `ms` |
| `hw/system/battery` | 获取电量 | — |
| `hw/system/network` | 获取网络状态 | — |
| `hw/clipboard/copy` | 复制到剪贴板 | `text` |
| `hw/clipboard/paste` | 从剪贴板粘贴 | — |

---

### `runner/exec` 沙箱全局变量

执行用户代码时，引擎注入以下全局：

| 变量 | 类型 | 说明 |
| --- | --- | --- |
| `__aicp_container__` | `HTMLElement \| null` | 渲染容器 |
| `__aicp_width__` | `number` | 容器宽度（px） |
| `__aicp_height__` | `number` | 容器高度（px） |
| `document / console / fetch / Math / Date / JSON` | — | 标准 Web API |
| `setTimeout / clearTimeout / setInterval / clearInterval` | — | 定时器 |
| `requestAnimationFrame / cancelAnimationFrame` | — | 动画帧 |

> ❌ 禁止使用：`require`、`process`、`fs`、Node.js API、`document.body`、`eval` 嵌套。

---

### 自定义插件

```javascript
// aicp-core/plugins/my-plugin.js
(function() {
    const registry = window.__aicp_registry__;
    registry.register('my/action', async (env, agent) => {
        // env.payload, env.sender, env.trace_id ...
        return { ok: true, data: 'hello' };
    });
})();
```
硬件插件遵循相同模式，参考 `plugins/hardware.js`。

在 `aicp-core.js` 的 `init()` 中加入新文件名即可自动加载。
