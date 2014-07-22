OpenLayers.Marker.HTMLMarkerLabel = OpenLayers.Class(OpenLayers.Marker, {

    /**
     * Property: label
     * {String} Marker label.
     */
    label: "",

    markerDiv: null,
	
	txtDiv: null,

    initialize: function(lonlat, icon, label) {
        OpenLayers.Marker.prototype.initialize.apply(this, [lonlat, icon]);

        this.label = label;
        this.markerDiv = OpenLayers.Util.createDiv();
		if(icon){
			this.markerDiv.appendChild(this.icon.imageDiv);
		}
		
        this.txtDiv = OpenLayers.Util.createDiv();
        this.txtDiv.className = 'markerLabel';
		this.txtDiv.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
		
		if(icon){
			OpenLayers.Util.modifyDOMElement(this.txtDiv, null, new OpenLayers.Pixel(0, this.icon.size.h));
		}else{
			OpenLayers.Util.modifyDOMElement(this.txtDiv, null, new OpenLayers.Pixel(0, 0));
		}
		
        this.txtDiv.innerHTML = this.label;
        this.markerDiv.appendChild(this.txtDiv);    

		this.events = new OpenLayers.Events(this, this.markerDiv);		
    },

    /**
     * Method: destroy
     * Nullify references and remove event listeners to prevent circular
     * references and memory leaks
     */
    destroy: function() {
        OpenLayers.Marker.prototype.destroy.apply(this, arguments);
        this.markerDiv.innerHTML = "";
        this.markerDiv = null;
    },

    draw: function(px) {
        OpenLayers.Util.modifyAlphaImageDiv(this.icon.imageDiv,
                                            null,
                                            null,
                                            this.icon.size,
                                            this.icon.url);

        OpenLayers.Util.modifyDOMElement(this.markerDiv, null, px);
        return this.markerDiv;
    },

    redraw: function(px) {
        if ((px != null) && (this.markerDiv != null)) {
            OpenLayers.Util.modifyDOMElement(this.markerDiv, null, px);
        }
    },

    moveTo: function (px) {
        this.redraw(px);
        this.lonlat = this.map.getLonLatFromLayerPx(px);
    },

    isDrawn: function() {
        return false;
    },
	
	updateLabel: function(newHTML){
		this.txtDiv.innerHTML = "";
		this.txtDiv.innerHTML = newHTML;
	},

    CLASS_NAME: "OpenLayers.Marker.HTMLMarkerLabel"
}); 