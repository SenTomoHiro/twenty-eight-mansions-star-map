# GitHub Pages 部署

项目使用 GitHub Actions 构建并部署到 GitHub Pages。`main` 分支每次 push 都会触发 `.github/workflows/deploy-pages.yml`，也可以在 Actions 页面手动运行。

## 构建流程

1. Checkout `main`。
2. 使用 Node.js 22 和 `npm ci` 安装锁定依赖。
3. 运行 typecheck、lint、test 和生产 build。
4. 只把 `dist/` 上传为 Pages artifact。
5. 通过官方 `actions/deploy-pages` 部署到 `github-pages` environment。

本地验证：

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

## Repository base path

`vite.config.ts` 在本地使用 `/`。GitHub Actions 中读取 `GITHUB_REPOSITORY` 的仓库名，并自动生成 `/<repository-name>/`，因此 CSS、JavaScript 和神像资源可以在 GitHub Project Pages 子路径下正确加载。

## 启用与检查

仓库 Settings → Pages 的 Source 必须设为 **GitHub Actions**。部署状态可在仓库 Actions 页面查看，也可以运行：

```bash
gh run list --workflow deploy-pages.yml
gh run view <run-id> --log
```

重新部署可以 push 新提交，或在 Actions 页面运行 `workflow_dispatch`。生产输出由 Actions 生成，不提交到 `main`。

