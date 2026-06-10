# Clawd Todo 🦀

一个 Windows 待办日历应用会和 Clawd 桌宠联动 —— 完成任务，小螃蟹会冒泡夸你，摸一摸也会有气泡，开启番茄钟会有互动等等。

[English](README.md) · 简体中文

灵感来自极序 APP 的简洁桌面待办风格，加上 Clawd 桌宠的鲜活反馈。Clawd 小螃蟹从"AI 编程伴侣"变成"学习/生活伴侣"。

**主要功能**

- **今日待办** — 主界面默认显示当天任务，按时间自动排序
- **响应式日历** — 窗口拉大自动显示月历，跨天任务以横条连续展示，参考苹果原生日历
- **分类管理** — 工作 / 学习 / 生活 + 自定义分类，彩色圆点区分，支持筛选
- **周期任务** — 支持每天 / 每周 / 每月重复
- **气泡说话** — 小螃蟹头顶冒话，圆角白底气泡跟随移动
- **拍一拍** — 点击小螃蟹，40 句中文鼓励话随机出现 + 像素手按下动画
- **动画联动** — 完成任务 happy、添加任务 typing、拖延 notification、深夜 sleeping、连续完成 building、多任务 juggling、清理任务 sweeping、过期 error
- **番茄钟** — 25 分钟专注 + 5 分钟休息，Clawd 戴耳机 groove 状态陪伴
- **快速便签** — 右上角浮层临时记录，本地保存
- **透明皮肤** — 窗口透明度可调，磨砂玻璃效果
- **自由缩放** — 窗口大小随意拖

**快速安装**

```bash
git clone https://github.com/genglezhang/clawd-todo.git
cd clawd-todo
npm install
npm run dev
```

**配合 Clawd 桌宠**

1. 安装 [Clawd-on-Desk](https://github.com/rullerzhou-afk/clawd-on-desk)
2. 给 Clawd 加 `/bubble` HTTP 接口补丁（让小螃蟹能说话），具体方法见 `docs/clawd-patch.md`
3. 同时启动 Clawd 和 Clawd Todo，开始享受小螃蟹陪你学习的乐趣

**技术栈**

Electron + React + Vite，本地 JSON 持久化，通过 `127.0.0.1:23333` 与 Clawd 通信。

**致谢**

- [Clawd-on-Desk](https://github.com/rullerzhou-afk/clawd-on-desk) by [@rullerzhou-afk](https://github.com/rullerzhou-afk) — 小螃蟹本蟹
- Anthropic — Clawd 角色设计 & Claude 模型
- 极序 APP — 桌面待办视觉灵感

**许可**

MIT License。本项目为 Clawd-on-Desk 的非官方周边作品，与原作者及 Anthropic 无官方关联。

**贡献**

欢迎 Issue 和 PR！

Made with 💕 by [@genglezhang](https://github.com/genglezhang)