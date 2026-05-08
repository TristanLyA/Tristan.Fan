name: 🔄 自动更新 FanVPN 节点订阅

on:
  # 每 6 小时自动运行一次
  schedule:
    - cron: '0 */6 * * *'
  # 支持在 GitHub 网页上手动触发
  workflow_dispatch:
    inputs:
      force:
        description: '强制更新（即使内容未变化也提交）'
        required: false
        default: 'false'

jobs:
  update-subscription:
    name: 拉取解密节点 & 更新订阅
    runs-on: ubuntu-latest
    permissions:
      contents: write   # 允许 push 到仓库

    steps:
      - name: 📥 检出仓库
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: 🟢 配置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: 🔓 执行解密 & 生成订阅文件
        run: node scripts/update.js

      - name: 📝 检查文件是否有变化
        id: diff
        run: |
          git diff --quiet Fan && echo "changed=false" >> $GITHUB_OUTPUT || echo "changed=true" >> $GITHUB_OUTPUT

      - name: 🚀 提交并推送更新
        if: steps.diff.outputs.changed == 'true' || github.event.inputs.force == 'true'
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add Fan
          git commit -m "🔄 自动同步节点 $(date -u '+%Y-%m-%d %H:%M UTC')"
          git push

      - name: ✅ 节点无变化，跳过提交
        if: steps.diff.outputs.changed == 'false' && github.event.inputs.force != 'true'
        run: echo "节点内容与上次相同，无需更新。"

