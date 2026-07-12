// plugins/runner.js — JS 代码执行器（完整版）
(function() {
    const registry = window.__aicp_registry__;

    registry.register('runner/exec', async (env, agent) => {
        const { 
            messages, 
            maxIter = 5, 
            container,           // 渲染容器：DOM元素、选择器字符串、或 null
            width,               // 容器宽度（可选，不传自动读容器尺寸）
            height,              // 容器高度（可选，不传自动读容器尺寸）
            onStart,             // 开始回调
            onDone,              // 完成回调
            onError,             // 错误回调
            onRetry,             // 重试回调 (iteration, error)
        } = env.payload;
        
        const model = agent.get('model') || 'gpt-3.5-turbo';
        if (onStart) onStart();

        const systemPrompt = `你是 AICP 协议运行时。你是执行者，不是聊天助手。
任何需求都必须用 JavaScript 代码实现，用 \`\`\`js 代码块包裹。

重要：代码中已注入以下全局变量：
- __aicp_container__：DOM 元素，所有渲染操作通过它完成
- __aicp_width__：容器宽度（像素）
- __aicp_height__：容器高度（像素）

示例：
\`\`\`js
const c = __aicp_container__;
const w = __aicp_width__;
const h = __aicp_height__;
const canvas = document.createElement('canvas');
canvas.width = w; canvas.height = h;
c.appendChild(canvas);
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'green'; ctx.fillRect(0, 0, w, h);
\`\`\`
Canvas 和 DOM 元素的尺寸必须使用 __aicp_width__ 和 __aicp_height__，不要写死数值。
容器已有 padding，你创建的 Canvas 和 DOM 元素不要加 margin 或额外的 padding。Canvas 宽高直接用 __aicp_width__ 和 __aicp_height__，不要减任何值。
禁止用 document.body。
禁止纯文本回复，除非用户明确说"聊天"。
禁止用 require() 和 Node.js API。`;

        const fullMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        // 解析容器
        const el = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        // 清空容器并确保最小高度
        if (el) {
            el.innerHTML = '';
            if (el.clientHeight === 0) el.style.minHeight = '300px';
        }

        // 容器尺寸：外部传入 > 容器实际尺寸 > 默认值
        const w = (width || (el ? el.clientWidth : 800) || 800) - 4;
        const h = (height || (el ? el.clientHeight : 600) || 600) - 4;

        for (let i = 0; i < maxIter; i++) {
            const llmResult = await registry.get('llm/chat')({ 
                payload: { messages: fullMessages, model } 
            }, agent);
            const raw = llmResult.data;

            const code = extractCode(raw);

            if (code) {
                try {
                    const sandbox = { 
                        __aicp_container__: el,
                        __aicp_width__: w,
                        __aicp_height__: h,
                        document,
                        console,
                        fetch,
                        Math,
                        Date,
                        JSON,
                        setTimeout,
                        clearTimeout,
                        setInterval,
                        clearInterval,
                        requestAnimationFrame,
                        cancelAnimationFrame,
                    };
                    
                    const keys = Object.keys(sandbox);
                    const values = Object.values(sandbox);
                    const fn = new Function(...keys, code);
                    const result = fn(...values);
                    
                    // 保存原始代码到容器属性
                    if (el) {
                        el.setAttribute('data-aicp-code', code);
                    }
                    
                    if (onDone) onDone(result);
                    return { ok: true, data: result };
                    
                } catch (e) {
                    if (onRetry) onRetry(i, e.message);
                    fullMessages.push({ role: 'assistant', content: raw });
                    fullMessages.push({ 
                        role: 'system', 
                        content: `代码执行失败: ${e.message}。请修复代码。` 
                    });
                    continue;
                }
            }

            if (onDone) onDone(raw);
            return { ok: true, data: raw };
        }

        if (onError) onError('达到最大迭代次数');
        return { ok: false, error: '达到最大迭代次数' };
    });

    function extractCode(raw) {
        if (!raw) return null;
        const match = raw.match(/```(?:javascript|js)?\s*\n([\s\S]*?)```/) 
                   || raw.match(/```\s*\n([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    }

    console.log('✅ runner.js 已加载');
})();