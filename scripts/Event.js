OLTools.Event = OLTools.Class({
	
	/**
	 * Function to call on event fire
	 */
	eventAction: null,
	
	initialize: function() {
		//name of the event
		this.eventName = arguments[0];
	},
	
	register: function(fn, scope) {
        this.eventAction = fn;
		this.scope = scope;
    },
	
	fire: function(sender, eventArgs) {
        if(this.eventAction != null) {
            this.eventAction(this, eventArgs, this.scope || sender || this);
        }/*else {
            alert('There is no handler registered for the ' + this.eventName + ' event!');
        }*/
    }
	
});