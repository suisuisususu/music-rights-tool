# 把「音乐版权检索与估价工具」上传到 GitHub

项目已初始化为 git 仓库，按以下步骤操作即可。

## 第一步：在 GitHub 创建空仓库

1. 打开 https://github.com/new
2. 仓库名建议：`music-rights-tool`
3. **不要**勾选 "Add a README"（项目里已有），保持空仓库
4. 点击 Create repository

## 第二步：推送代码

在项目根目录（`app/`）执行：

```bash
# 确认 .env 不会被提交（已在 .gitignore 中，双保险检查一下）
git status

# 提交全部代码
git add .
git commit -m "feat: 音乐版权检索与估价工具首个版本"

# 关联你的 GitHub 仓库（把 USERNAME 换成你的用户名）
git remote add origin https://github.com/USERNAME/music-rights-tool.git
git branch -M main
git push -u origin main
```

## 第三步（可选）：配置密钥以解锁完整功能

不上传密钥也能跑，但配置后体验完整：

| 密钥 | 作用 | 申请 |
|---|---|---|
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | ISRC、封面、专辑 label（Master Owner 线索） | https://developer.spotify.com/dashboard （免费） |
| `TAVILY_API_KEY` | 估价时实时检索公开报价案例 | https://tavily.com （免费 1000 次/月） |

本地使用：复制 `.env.example` 为 `.env` 填入即可。

## 注意事项

- **切勿提交 `.env`**——里面是你本地/平台的私密凭证，`.gitignore` 已排除，推送前可用 `git status` 确认
- 本项目含平台生成的 `db/`（数据库脚手架），工具本身不使用数据库，可保留忽略，也可删除 `db/`、`drizzle.config.ts`、`api/queries/` 让仓库更干净（删除后不影响运行）
- 若想让他人一键运行，README 里已写好 Quick Start（`npm install && npm run dev`）

## 常见推送问题

- **推送要求登录**：推荐使用 Personal Access Token（GitHub → Settings → Developer settings → Tokens）代替密码
- **首次 push 被拒**：确认创建仓库时没有勾选初始化 README，否则先 `git pull --rebase origin main`
