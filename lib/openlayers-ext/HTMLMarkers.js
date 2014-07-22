/**
 * @requires OpenLayers/Layer/Markers.js
 * @requires OpenLayers/Request/XMLHttpRequest.js
 */

/**
 * Class: OpenLayers.Layer.HTMLMarker
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Markers>
 */
OpenLayers.Layer.HTMLMarkers = OpenLayers.Class(OpenLayers.Layer.Markers, {

    /**
     * APIProperty: location 
     * {String} URL of text file.  Must be specified in the "options" argument
     *   of the constructor. Can not be changed once passed in. 
     */
    location:null,
	
	/**
	*/
	style:null,
	
	/**
	*/
	labelAttribute:null,

    /** 
     * Property: features
     * {Array(<OpenLayers.Feature>)} 
     */
    features: null,
    
	defaultStyle: {
		'externalGraphic': OpenLayers.Util.getImageLocation("marker.png"),
		'graphicWidth': 21,
		'graphicHeight': 25,
		'graphicXOffset': -10.5,
		'graphicYOffset': -12.5
	},

    /** 
     * Property: selectedFeature
     * {<OpenLayers.Feature>}
     */
    selectedFeature: null,

    /**
     * Constructor: OpenLayers.Layer.Text
     * Create a text layer.
     * 
     * Parameters:
     * name - {String} 
     * options - {Object} Object with properties to be set on the layer.
     *     Must include <location> property.
     */
    initialize: function(name, options) {
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, arguments);
		this.location = options.location;
		this.style = (options.styleMap ? (options.styleMap.style ? options.styleMap.style : null) : null) || this.defaultStyle;
		this.labelAttribute = options.labelAttribute;
		this.useIconStyle = options.useIconStyle;
        this.features = [];
    },

    /**
     * APIMethod: destroy 
     */
    destroy: function() {
        // Warning: Layer.Markers.destroy() must be called prior to calling
        // clearFeatures() here, otherwise we leak memory. Indeed, if
        // Layer.Markers.destroy() is called after clearFeatures(), it won't be
        // able to remove the marker image elements from the layer's div since
        // the markers will have been destroyed by clearFeatures().
        OpenLayers.Layer.Markers.prototype.destroy.apply(this, arguments);
        this.clearFeatures();
        this.features = null;
    },
    
    /**
     * Method: loadText
     * Start the load of the Text data. Don't do this when we first add the layer,
     * since we may not be visible at any point, and it would therefore be a waste.
     */
    loadText: function() {
        if (!this.loaded) {
            if (this.location != null) {

                var onFail = function(e) {
                    this.events.triggerEvent("loadend");
                };

                this.events.triggerEvent("loadstart");
                OpenLayers.Request.GET({
                    url: this.location,
                    success: this.parseData,
                    failure: onFail,
                    scope: this
                });
                this.loaded = true;
            }
        }    
    },    
    
    /**
     * Method: moveTo
     * If layer is visible and Text has not been loaded, load Text. 
     * 
     * Parameters:
     * bounds - {Object} 
     * zoomChanged - {Object} 
     * minor - {Object} 
     */
    moveTo:function(bounds, zoomChanged, minor) {
        OpenLayers.Layer.Markers.prototype.moveTo.apply(this, arguments);
        if(this.visibility && !this.loaded){
            this.loadText();
        }
    },
    
    /**
     * Method: parseData
     *
     * Parameters:
     * ajaxRequest - {<OpenLayers.Request.XMLHttpRequest>} 
     */
    parseData: function(ajaxRequest) {
        var geojson = ajaxRequest.responseText;

		var parser = new OpenLayers.Format.GeoJSON();		
        var features = parser.read(geojson);
		
        for (var i=0, len=features.length; i<len; i++) {
            var data = {};
            var feature = features[i];
			data.attributes = feature.attributes;
			data.geometry = feature.geometry;
			
			if(this.useIconStyle === true){
				feature.style = this.style;
			}			
            
			var location;
            var iconSize, iconOffset;
            
            location = new OpenLayers.LonLat(feature.geometry.x, 
                                             feature.geometry.y);
            
			
            if (this.useIconStyle && feature.style.graphicWidth 
                && feature.style.graphicHeight) {
                iconSize = new OpenLayers.Size(
                    feature.style.graphicWidth,
                    feature.style.graphicHeight);
            }        
            
            // FIXME: At the moment, we only use this if we have an 
            // externalGraphic, because icon has no setOffset API Method.
            /**
             * FIXME FIRST!!
             * The Text format does all sorts of parseFloating
             * The result of a parseFloat for a bogus string is NaN.  That
             * means the three possible values here are undefined, NaN, or a
             * number.  The previous check was an identity check for null.  This
             * means it was failing for all undefined or NaN.  A slightly better
             * check is for undefined.  An even better check is to see if the
             * value is a number (see #1441).
             */
            if (this.useIconStyle && feature.style.graphicXOffset !== undefined
                && feature.style.graphicYOffset !== undefined) {
                iconOffset = new OpenLayers.Pixel(
                    feature.style.graphicXOffset, 
                    feature.style.graphicYOffset);
            }
            
			if(this.useIconStyle){
				if (feature.style.externalGraphic != null) {
					data.icon = new OpenLayers.Icon(feature.style.externalGraphic, 
													iconSize, 
													iconOffset);
				}else{
					data.icon = OpenLayers.Marker.defaultIcon();

					// Allows for the case where the image url is not 
					// specified but the size is. Use a default icon
					// but change the size
					if (iconSize != null) {
						data.icon.setSize(iconSize);
					}
				}
			}
            
            var markerFeature = new OpenLayers.HTMLFeature(this, location, data);
			
            this.features.push(markerFeature);
			
			var label = eval("feature.attributes." + this.labelAttribute);
            var marker = markerFeature.createMarker(label, this.useIconStyle, this.markerClick);
			
            this.addMarker(marker);
        }
		
        this.events.triggerEvent("loadend", this.features);
    },
    
    /**
     * Property: markerClick
     * 
     * Parameters:
     * evt - {Event} 
     *
     * Context:
     * - {<OpenLayers.Feature>}
     */
    markerClick: function(evt) {
        var sameMarkerClicked = (this == this.layer.selectedFeature);
        this.layer.selectedFeature = (!sameMarkerClicked) ? this : null;		
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: clearFeatures
     */
    clearFeatures: function() {
        if (this.features != null) {
            while(this.features.length > 0) {
                var feature = this.features[0];
                OpenLayers.Util.removeItem(this.features, feature);
                feature.destroy();
            }
        }        
    },

    CLASS_NAME: "OpenLayers.Layer.HTMLMarkers"
});

/**
 * @requires OpenLayers/Feature.js
 */
OpenLayers.HTMLFeature = OpenLayers.Class(OpenLayers.Feature, {

	/**
	*/
	createMarker: function(label, useIconStyle, handler) {
        if (this.lonlat != null && label != null) {
			var icon = useIconStyle === true ? this.data.icon : false;
            this.marker = new OpenLayers.Marker.HTMLMarkerLabel(this.lonlat, icon, label);
			
			if(this.marker && handler){
				this.marker.events.register('click', this, handler);
            }
        }		
        return this.marker;
    }
});
