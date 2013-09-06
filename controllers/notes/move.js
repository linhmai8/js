var NoteMoveController = Composer.Controller.extend({
	elements: {
		'select[name=board]': 'inp_select'
	},

	events: {
		'change select': 'select_board'
	},

	note: null,
	board: null,

	init: function()
	{
		if(!this.note || !this.board) return false;

		this.render();

		modal.open(this.el);
		var close_fn = function() {
			this.release();
			modal.removeEvent('close', close_fn);
		}.bind(this);
		modal.addEvent('close', close_fn);

		turtl.keyboard.detach(); // disable keyboard shortcuts while editing
	},

	release: function()
	{
		turtl.keyboard.attach(); // re-enable shortcuts
		this.parent.apply(this, arguments);
	},

	render: function()
	{
		var boards = turtl.profile.get('boards').map(function(p) {
			return {id: p.id(), title: p.get('title')};
		});
		//boards.sort(function(a, b) { return a.title.localeCompare(b.title); });
		var content = Template.render('notes/move', {
			note: toJSON(this.note),
			boards: boards
		});
		this.html(content);
	},

	select_board: function(e)
	{
		if(e) e.stop();
		var bid = this.inp_select.get('value');
		var curbid = this.note.get('board_id');
		if(curbid == bid) return false;

		var boardfrom = turtl.profile.get('boards').find_by_id(curbid);
		var boardto = turtl.profile.get('boards').find_by_id(bid);
		if(!boardfrom || !boardto) return false;

		this.note.set({board_id: bid}, {silent: true});
		this.note.generate_subkeys([
			{b: bid, k: boardto.key}
		], {silent: true});

		turtl.loading(true);
		this.note.save({
			success: function(note_data) {
				modal.close();
				turtl.loading(false);
				this.note.set(note_data);
				boardfrom.get('notes').remove(this.note);
				//boardfrom.get('tags').trigger('change:selected');
				boardto.get('notes').add(this.note);
			}.bind(this),
			error: function(e) {
				barfr.barf('There was a problem moving your note: '+ e);
				turtl.loading(false);
			}
		});
	}
});
