\# Clawd Todo 🦀



> 一个Windows 待办日历应用会和 Clawd 桌宠联动 —— 完成任务，小螃蟹会冒泡夸你，摸一摸也会有气泡，开启番茄钟会有互动等等。



\[English](README.md) · 简体中文



!\[platform](https://img.shields.io/badge/platform-Windows-blue)

!\[license](https://img.shields.io/badge/license-MIT-green)

!\[stack](https://img.shields.io/badge/stack-Electron%20%2B%20React-61dafb)



\---



\## ✨ 这是什么



\*\*Clawd Todo\*\* 是一个为 \[Clawd-on-Desk](https://github.com/rullerzhou-afk/clawd-on-desk) 桌宠设计的待办日历伙伴应用。把 Clawd 小螃蟹变成"学习/生活伴侣"——你完成任务，它跳起来庆祝；你拖延，它提醒你；你点它一下，它说话。



灵感来自 \[极序 APP](https://www.bilibili.com/) 的简洁桌面待办风格，加上 Clawd 桌宠的鲜活反馈。



\---



\## 🌟 主要功能



\### 待办与日历

\- 📋 \*\*今日待办\*\* —— 主界面默认显示当天任务

\- 📅 \*\*响应式日历\*\* —— 窗口拉大自动显示月历，跨天任务以横条连续展示

\- 🏷️ \*\*分类管理\*\* —— 工作/学习/生活 + 自定义分类，彩色圆点区分

\- 🔁 \*\*周期任务\*\* —— 支持每天/每周/每月重复

\- ⏰ \*\*时间排序\*\* —— 按起始时间自动排序，类苹果日历样式



\### Clawd 桌宠联动

\- 💬 \*\*气泡说话\*\* —— 小螃蟹头顶冒话，圆角白底气泡

\- 👋 \*\*拍一拍\*\* —— 点击螃蟹，40 句中文鼓励话随机出现

\- 🎬 \*\*动画状态\*\* —— 完成任务 happy、添加任务 typing、拖延 notification、深夜 sleeping、连续完成 building……



\### 番茄钟 \& 便签

\- 🍅 \*\*25 + 5 番茄钟\*\* —— Clawd 戴耳机陪你专注

\- 📝 \*\*快速便签\*\* —— 右上角浮层，临时灵感不丢失



\### 外观

\- 🪟 \*\*透明皮肤\*\* —— 调节窗口透明度，磨砂玻璃效果

\- 🔍 \*\*自由缩放\*\* —— 窗口大小随意拖



\---



\## 🚀 快速安装



\### 从源码运行



```bash

\\# 克隆仓库

git clone https://github.com/genglezhang/clawd-todo.git

cd clawd-todo



\\# 安装依赖

npm install



\\# 启动

npm run dev

```



\### 配合 Clawd 桌宠（推荐）



1\. 先去 \[Clawd-on-Desk](https://github.com/rullerzhou-afk/clawd-on-desk) 下载并安装小螃蟹

2\. 给 Clawd 打上 `/bubble` HTTP 接口补丁（说明见 `docs/clawd-patch.md`）

3\. 启动 Clawd Todo，开始享受小螃蟹陪你学习的乐趣 🦀



\---



\## 🛠 技术栈



\- \*\*Electron\*\* —— 桌面应用框架

\- \*\*React + Vite\*\* —— 前端 UI

\- \*\*本地 JSON\*\* —— 数据持久化，无云端依赖

\- \*\*HTTP\*\* —— 通过 `127.0.0.1:23333` 与 Clawd 通信



\---



\## 💡 致谢



\- \[Clawd-on-Desk](https://github.com/rullerzhou-afk/clawd-on-desk) by \[@rullerzhou-afk](https://github.com/rullerzhou-afk) —— 小螃蟹本蟹

\- \[Anthropic](https://anthropic.com) —— Clawd 角色设计 \& Claude 模型

\- 极序 APP —— 桌面待办视觉灵感



\---



\## 📄 许可



MIT License —— 自由使用、修改、分发



本项目为 Clawd-on-Desk 的非官方周边作品，与原作者及 Anthropic 无关联。



\---



\## 🤝 贡献



欢迎 Issue 和 PR！如果你也想给小螃蟹加新的互动玩法，直接来。



Made with 💕 by \[@genglezhang](https://github.com/genglezhang)

