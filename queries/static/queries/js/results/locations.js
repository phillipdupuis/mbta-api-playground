embedLocationPlots();

function embedLocationPlots() {
	const locationPlots = JSON.parse(document.getElementById('location_plots').textContent);
	if (locationPlots.length > 0) {
		locationPlots.forEach(plot => Bokeh.embed.embed_item(plot));
	}
}