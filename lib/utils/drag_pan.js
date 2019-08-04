module.exports = {
    enable(ctx) {
        setTimeout(() => {
            // First check we've got a map and some context.
            if (!ctx.map || !ctx.map.dragPan || !ctx._ctx || !ctx._ctx.store || !ctx._ctx.store.getInitialConfigValue) return;
            // Now check initial state wasn't false (we leave it disabled if so)
            if (!ctx._ctx.store.getInitialConfigValue('dragPan')) return;
            ctx.map.dragPan.enable();
        }, 0);
    },
    disable(ctx) {
        setTimeout(() => {
            if (!ctx.map || !ctx.map.doubleClickZoom) return;
            // Always disable here, as it's necessary in some cases.
            ctx.map.dragPan.disable();
        }, 0);
    }
};
