# 音乐版权检索与估价工具（Music Rights Tool）

输入**歌名 + 歌手名**，自动检索网络公开数据源，汇总该歌曲的 **Publishers（词曲版权方）** 与 **Master Owner（录音版权方）** 及联系入口；并按你定义的**使用方式 / 场景 / 范围**，基于 2025–2026 年公开市场数据给出授权费用估价。**支持中英文界面一键切换。**

> A full-stack web tool that looks up music copyright ownership (publishers & master owner) and estimates sync/master licensing fees based on current market data.

---

## 功能

### 0. 中英文双语
- 界面右上角一键切换 中文 / English，选择会记住在浏览器中
- 检索结果、数据源状态、估价说明、免责声明全部双语

### 1. 版权信息检索
- 输入歌名 + 歌手，并行查询多个数据源：
  - **MusicBrainz**（开放数据库，免密钥）：ISRC、发行厂牌、词曲作者、部分 publisher 关系
  - **Spotify Web API**（需免费 Client Credentials）：ISRC、专辑 label（Master Owner 重要线索）、封面、流行度
  - **QQ音乐**（网页端公开接口，免密钥）：中文歌曲覆盖好，提供唱片公司（Master Owner 线索）、发行时间
  - **The MLC Public Search API**（官方 API，付费数据计划：约 $100 设置费 + $25/月）：publishers（含份额/IPI）、词曲作者、ISWC，覆盖 5500 万+ 作品；免费替代是其网页版 Public Work Search 手动查询
  - **Songview（ASCAP + BMI 联合库）/ BMI Repertoire**：尽力自动尝试；被反爬拦截时明确标注「需手动检索」并给出直达入口
  - **SESAC / HFA Songfile**：提供手动检索入口
- 每个数据源单独汇报状态（成功 / 部分数据 / 未找到 / 需手动检索 / 未配置）
- **检索不到就直说**：publishers 或 master owner 未找全时，显著提示手动检索，绝不编造数据

### 2. 授权费用评估
- 先定义使用方式：
  - **权利类型**：词曲（Sync）/ 录音（Master）/ 两者都要
  - **场景**：电影、预告片、电视/流媒体剧集、各级广告、游戏、播客、自媒体、企业视频等 16 类
  - **范围**：显著度、地域、期限、独占性、歌曲知名度、使用时长
- 输出：
  - **公开报价案例**（配置 Tavily / SerpAPI 密钥后实时检索，主要参考）
  - 估价区间 + Sync/Master 拆分（行业惯例 1:1 MFN）
  - 完整计算因子表（每个维度的乘数透明可见）
  - 内置行业参考区间（小字兜底，源自 2025–2026 公开市场数据）
  - 谈判要点与免责声明

## 技术栈

React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui（前端）｜ Hono + tRPC（后端）

```
api/            后端（Hono + tRPC）
  services/     MusicBrainz / Spotify / PRO 数据源 / 估价引擎 / 案例检索
  routers/      lookup（检索）、estimate（估价）
contracts/      前后端共享类型与常量（估价选项、手动检索入口）
src/            前端页面与组件
```

## 快速开始

```bash
npm install
cp .env.example .env   # 按需填写密钥，全部留空也能运行
npm run dev            # 开发模式 http://localhost:3000
```

生产模式：

```bash
npm run build
npm start              # http://localhost:3000
```

## 环境变量

| 变量 | 必需 | 说明 |
|---|---|---|
| `APP_ID` / `APP_SECRET` / `DATABASE_URL` | 是（可填占位值） | 框架启动校验用；本工具不使用数据库 |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | 建议 | [Spotify Dashboard](https://developer.spotify.com/dashboard) 免费申请，显著提升检索质量 |
| `MLC_USERNAME` / `MLC_PASSWORD` | 可选（付费） | [The MLC Data Programs](https://www.themlc.com/dataprograms) 注册 Public Search API（付费数据计划），可查 publishers 份额 |
| `TAVILY_API_KEY` 或 `SERPAPI_KEY` | 可选 | 启用「公开报价案例」实时检索 |

> **安全提示**：`.env` 已在 `.gitignore` 中，切勿把真实密钥提交到 GitHub。

## 估价方法说明

估价 = 场景基准区间（2025–2026 公开市场数据）× 六个维度乘数，再给出 ±40% 谈判带宽：

- 基准数据综合自 Songtradr/BMI 公开披露、Chartlex 2026 费率卡、DropCue 2026 实务数据、FWD Music 2026 指南、Billboard 报道等公开资料
- 乘数依据行业惯例：突出使用 +50%、片尾 +100%、主题曲 +150%；全球 +80%；永久约 ×2.5；有限独占 +50%、完全独占 +150%；30 秒内减半等
- 经验法则：音乐授权预算 ≈ 项目制作预算或媒介投放费用的 1%–5%

**免责声明**：本工具输出仅供参考，不构成法律或商业建议。音乐授权费为逐案谈判结果，实际价格以权利人报价为准；重大商业使用请咨询专业音乐版权律师。

## 已知限制

- ASCAP / BMI / SESAC 等 PRO 数据库有反爬保护，自动检索成功率有限——这是行业现状，工具以「状态透明 + 手动入口」应对
- QQ音乐接口为网页端公开接口，无稳定性保证；失效时仅影响中文歌曲的唱片公司字段
- MusicBrainz 为社区数据库，publisher 关系覆盖不全
- 估价未覆盖：机械授权（Mechanical）、公播权、中国大陆市场的特殊行情

## License

[MIT](./LICENSE)
