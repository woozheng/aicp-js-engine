// plugins/hardware.js — 硬件能力插件（复用 god_mode 的 AICP 封装）
(function() {
    const registry = window.__aicp_registry__;
    const AICP = window.AICP;

    if (!AICP) {
        console.warn('⚠️ AICP Shell 未连接，硬件插件跳过注册');
        return;
    }

    // 相机
    registry.register('hw/camera/take', async () => {
        const r = await AICP.camera.take_photo();
        return { ok: r?.ok !== false, data: r };
    });
    registry.register('hw/camera/gallery', async () => {
        const r = await AICP.camera.pick_from_gallery();
        return { ok: r?.ok !== false, data: r };
    });

    // 扫码
    registry.register('hw/scanner/scan', async () => {
        const r = await AICP.scanner.scan();
        return { ok: r?.ok !== false, data: r };
    });

    // GPS
    registry.register('hw/gps/locate', async () => {
        const r = await AICP.gps.get_current();
        return { ok: r?.ok !== false, data: r };
    });
    registry.register('hw/gps/start', async () => {
        await AICP.gps.start_tracking();
        return { ok: true };
    });
    registry.register('hw/gps/stop', async () => {
        await AICP.gps.stop_tracking();
        return { ok: true };
    });

    // 蓝牙
    registry.register('hw/bluetooth/scan', async () => {
        await AICP.bluetooth.scanStart();
        return { ok: true };
    });
    registry.register('hw/bluetooth/devices', async () => {
        const r = await AICP.bluetooth.getDevices();
        return { ok: r?.ok !== false, data: r };
    });
    registry.register('hw/bluetooth/connect', async (env) => {
        const r = await AICP.bluetooth.connect(env.payload.address);
        return { ok: r?.ok !== false, data: r };
    });

    // 音频
    registry.register('hw/audio/record', async () => {
        await AICP.audio.recordStart();
        return { ok: true };
    });
    registry.register('hw/audio/stop', async () => {
        const r = await AICP.audio.recordStop();
        return { ok: r?.ok !== false, data: r };
    });
    registry.register('hw/audio/play', async (env) => {
        await AICP.audio.play(env.payload.path);
        return { ok: true };
    });

    // 文件系统
    registry.register('hw/fs/list', async (env) => {
        const r = await AICP.file_system.list(env.payload.path);
        return { ok: r?.ok !== false, data: r };
    });
    registry.register('hw/fs/read', async (env) => {
        const r = await AICP.file_system.read(env.payload.path);
        return { ok: r?.ok !== false, data: r };
    });
    registry.register('hw/fs/write', async (env) => {
        const r = await AICP.file_system.write(env.payload.path, env.payload.content);
        return { ok: r?.ok !== false, data: r };
    });
    registry.register('hw/fs/delete', async (env) => {
        const r = await AICP.file_system.delete(env.payload.path);
        return { ok: r?.ok !== false, data: r };
    });

    // 进程（桌面端）
    registry.register('hw/process/shell', async (env) => {
        const r = await AICP.process.shell(env.payload.cmd);
        return { ok: r?.ok !== false || r?.exit_code === 0, data: r };
    });
    registry.register('hw/process/open', async (env) => {
        const r = await AICP.process.open(env.payload.target);
        return { ok: r?.ok !== false, data: r };
    });

    // 系统
    registry.register('hw/system/notify', async (env) => {
        await AICP.notify.send(env.payload.title || 'AICP', env.payload.body || '');
        return { ok: true };
    });
    registry.register('hw/system/vibrate', async (env) => {
        await AICP.vibrate.vibrate(env.payload.ms || 200);
        return { ok: true };
    });
    registry.register('hw/system/battery', async () => {
        const r = await AICP.battery.get_status();
        return { ok: r?.ok !== false, data: r };
    });
    registry.register('hw/system/network', async () => {
        const r = await AICP.network.status();
        return { ok: r?.ok !== false, data: r };
    });

    // 剪贴板
    registry.register('hw/clipboard/copy', async (env) => {
        await AICP.clipboard.copy(env.payload.text);
        return { ok: true };
    });
    registry.register('hw/clipboard/paste', async () => {
        const r = await AICP.clipboard.paste();
        return { ok: r?.ok !== false, data: r };
    });

    console.log('✅ hardware.js 已加载 (22 个硬件能力)');
})();