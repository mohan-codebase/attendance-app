// Draws a line of text in the hole of a doughnut chart (e.g. "Total : 100%").
// Used by the dashboard's day-wise summary and the report's per-course cards.
export const centerLabel = {
  id: 'centerLabel',
  afterDatasetsDraw(chart, args, opts) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta.data.length) return;
    const { x, y } = meta.data[0];

    ctx.save();
    ctx.font = `600 ${opts.size || 13}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = opts.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.text, x, y);
    ctx.restore();
  },
};

export default centerLabel;
