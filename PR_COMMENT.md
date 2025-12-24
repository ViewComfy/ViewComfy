# 工作流自动保存到 localStorage 功能

## 概述
实现了在 editor 页面自动保存和恢复工作流到 localStorage 的功能，避免用户刷新页面或关闭浏览器后工作流丢失。

## 实现内容

### 1. 工具函数 (`lib/utils.ts`)
- 新增 `saveWorkflowsToLocalStorage()`: 将当前工作流状态保存到 localStorage，使用 view_comfy.json 格式
- 新增 `loadWorkflowsFromLocalStorage()`: 从 localStorage 加载保存的工作流
- 两个函数都包含错误处理，在 localStorage 不可用或数据损坏时静默失败

### 2. 页面集成 (`components/pages/view-comfy/view-comfy-page.tsx`)
- **自动加载**: 页面首次加载时，如果当前没有工作流，自动从 localStorage 恢复之前保存的工作流
- **自动保存**: 当工作流状态发生变化时（包括 Save Changes、添加/删除工作流、修改 App Title/Image），自动保存到 localStorage
- **多工作流支持**: 支持保存和恢复多个 workflow，完整保留所有 workflowApiJSON 数据
- **导入覆盖**: 当用户导入新的 workflow 文件时，新内容会覆盖 localStorage 中的旧数据

## 技术细节

### 保存格式
使用与导出功能相同的 view_comfy.json 格式，包含：
- `file_type`: "view_comfy"
- `file_version`: "1.0.0"
- `version`: "0.0.1"
- `appTitle`: 应用标题
- `appImg`: 应用图片 URL
- `workflows`: 所有工作流数组，每个包含 `viewComfyJSON` 和 `workflowApiJSON`

### 兼容性
- 使用 localStorage API，兼容所有现代浏览器
- 包含 `typeof window !== "undefined"` 检查，确保 SSR 安全
- 错误处理确保在 localStorage 不可用（如隐私模式）时不会导致应用崩溃

### 代码改动
- 最小化代码改动，仅在必要位置添加保存/加载逻辑
- 使用 `useRef` 避免初始加载时的循环保存问题
- 保持与现有代码注释风格一致

## 使用场景
1. 用户编辑工作流后点击 "Save Changes" → 自动保存
2. 用户添加/删除工作流 → 自动保存
3. 用户修改 App Title 或 App Image → 自动保存
4. 用户刷新页面 → 自动恢复之前的工作流
5. 用户关闭浏览器后重新打开 → 自动恢复之前的工作流
6. 用户导入新的 workflow 文件 → 新内容覆盖旧保存

## 安全性
- 数据仅存储在用户本地浏览器，不会发送到服务器
- 使用标准的 localStorage API，无额外安全风险
- 错误处理确保不会泄露敏感信息

## 测试建议
1. 创建/编辑工作流后刷新页面，验证数据恢复
2. 导入多个 workflow，验证所有 workflow 都被保存
3. 在隐私模式下测试，验证错误处理正常
4. 清除浏览器数据后测试，验证从空状态开始正常工作

