// aicp-core.js — 主入口，用 Config 接管配置
import { Agent } from './core/agent.js';
import { Envelop } from './core/envelop.js';
import { Registry } from './core/registry.js';
import { Router } from './core/router.js';
import { Config } from './aicp-config.js';

class AICP {
    constructor(config = {}) {
    let savedConfig = Config.load();
    if (!savedConfig) {
        savedConfig = Config.prompt();
        if (!savedConfig) throw new Error('未配置');
    }
    this.config = savedConfig;
    this.registry = new Registry();
    this.router = new Router(this.registry);
    this.agent = new Agent(this.config);
    window.__aicp_registry__ = this.registry;
}

    async init() {
        const pluginFiles = ['llm.js', 'runner.js'];
        const base = new URL('./plugins/', import.meta.url).href;
        await Promise.all(pluginFiles.map(f => import(base + f)));
    }

    async send(receiver, payload = {}, intent = '') {
        const envelop = new Envelop({ sender: 'main', receiver, intent, payload });
        return await this.router.route(envelop, this.agent);
    }
}

const aicp = new AICP();
await aicp.init();
export { AICP, aicp, Config };
export default aicp;