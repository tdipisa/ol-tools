OLTools.Tool.IconAnnotation = OLTools.Class(OLTools.Tool, {

	layer: null,
	
	popup: null,
	
	featureAttributes: [],
	
	controls: [],
	
	panel: null,
	
	active: false,
	
	selectControlName: "Point Annotation Select Feature",
	
    iconDefault: {
		//label: "${text}",
		fontWeight: "bold",
		fontSize: "10px",
		fontColor: "#FFFFFF",
        labelSelect: true,
		graphicWidth: 32,
        graphicHeight: 37
	},
	
	iconSelected: {
		//label: "${text}",
		fontWeight: "bold",
		fontSize: "10px",
		fontColor: "#FFFFFF",
		graphicWidth: 32,
        graphicHeight: 37
	},
	
	defaultIcon: "theme/img/markers/default_information.png",
	
    initialize: function(options) {
		OLTools.Tool.prototype.initialize.apply(this, arguments);
		this.popup = new OLTools.Tool.EditPopup(options); 
		
		//
		// Set the internal icon list to use 
		//
		var defaultIconList = [
			{name: "Default Icon", url: "theme/img/markers/default_information.png", isDefault: true},
			{name: "Agritourism", url: "theme/img/markers/agritourism.png"},
			{name: "Bigcity", url: "theme/img/markers/bigcity.png"},
			{name: "Bridge mModern", url: "theme/img/markers/bridge_modern.png"},
			{name: "Arch", url: "theme/img/markers/arch.png"},
			{name: "Cathedral", url: "theme/img/markers/cathedral.png"}
		];
		this.iconsList = options.iconsList ? options.iconsList : defaultIconList;		

		if(options.iconAttribute){
			this.iconAttribute = options.iconAttribute;
		}
		
		//
		// Check for avilable renderer 
		//
		this.renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
		this.renderer = (this.renderer) ? [this.renderer] : OpenLayers.Layer.Vector.prototype.renderers;
		
		//
		// Set the Icon style for the icon vector layer
		//
		var context = this.getStyleContext();		
		this.iconDefault.externalGraphic = "${getMarkerIcon}";        
		this.iconSelected.externalGraphic = "${getMarkerSelectionIcon}";	      
		
		this.styles = new OpenLayers.StyleMap({ 
            "default" : new OpenLayers.Style(this.iconDefault, {context:context}),
            "select" : new OpenLayers.Style(this.iconSelected, {context:context})
        }); 
    },
	
	getStyleContext: function(){
		var context = {
            getMarkerIcon : function (ft){
				var iconPath = ft.attributes.icon ? ft.attributes.icon : this.defaultIcon;
                return iconPath;
            },			
			getMarkerSelectionIcon : function (ft){
				var iconPath = "theme/img/markers/default_information_select.png";
                return iconPath;              
            }
        };
		
		return context;
	},
	
	activate: function(){
		if(this.options){			
			// /////////////////////////////////////
			// Defining Layer Vector for this tool
			// /////////////////////////////////////		
			if(this.options.strategies && this.options.url){
				this.layer = new OpenLayers.Layer.Vector(this.options.vectorName || "point-annotation-vector", {
					renderers: this.renderer,
					strategies: this.options.strategies,                
					protocol: new OpenLayers.Protocol.HTTP({
						url: this.options.url,
						format: new OpenLayers.Format.GeoJSON()
					}),
					styleMap: this.styles
				});
			}else{
				this.layer = new OpenLayers.Layer.Vector(this.options.vectorName || "point-annotation-vector", {
					renderers: this.renderer,
					styleMap: this.styles
				});
			}	

			this.attachEventListeners();

			this.map.addLayers([this.layer]);
			
			// /////////////////////////////////////
			// Defining Draw and Modify controls
			// /////////////////////////////////////
			this.drawFeature = new OpenLayers.Control.DrawFeature(this.layer, OpenLayers.Handler.Point, {
				autoActivate: false
			});
			this.controls.push(this.drawFeature);
			
			// /////////////////////////////////////
			// Draw Point Control Button
			// /////////////////////////////////////
		    var drawIcon = new OpenLayers.Control.Button({
				displayClass: "olControlDrawFeaturePoint", 
				id: "drawPoint",
				type: OpenLayers.Control.TYPE_TOGGLE
			});			
			drawIcon.events.register('activate', this, function(){
				this.hideEditPopup();
				this.hideIconsPopup();
				
				var position = {
					x: this.map.div.clientWidth/2,
					y: this.map.div.clientHeight/2
				};				
				this.showIconListPopup(position);	
			});
			drawIcon.events.register('deactivate', this, function(){
				this.hideEditPopup();
				this.hideIconsPopup();
				
				this.drawFeature.deactivate();
				
				if(!this.popup.featureModified.attributes && !this.popup.featureModified.saved){
					this.layer.destroyFeatures([this.popup.feature]);					
				}
			});
			this.controls.push(drawIcon);

			// /////////////////////////////////////
			// Delete Control
			// /////////////////////////////////////
			var del = new DeleteFeature(this.layer, {title: "Delete Feature"});
			
			del.events.register('activate', this, function(){
				this.hideEditPopup();
			});		   
		    this.controls.push(del);
			
			// /////////////////////////////////////
			// Select Control
			// /////////////////////////////////////
			var select = new OpenLayers.Control.SelectFeature(
				this.layer,
				{
					title: this.selectControlName,
					clickout: false, 
					toggle: false,
					multiple: false, 
					hover: false,
					displayClass: "olControlSelectFeature"
				}
			);
			
			select.events.register('deactivate', this, function(){
				select.unselectAll();
				this.hideEditPopup();
			});			
			this.layer.selectControl = select;			
			this.controls.push(select);
			
			// /////////////////////////////////////
			// Controls Toolbar 
			// /////////////////////////////////////
			this.panel = new OpenLayers.Control.Panel({
				displayClass: 'customEditingToolbar',
				allowDepress: true
			});
			this.panel.addControls(this.controls);			
			this.map.addControl(this.panel);
			
			this.active = true;
		}else{
			this.active = false;
		}
	},
	
	deactivate: function(){
		if(this.active === true){
			// destroy map controls of this tool
			for(var i=0; i< this.controls.length; i++){
				var control = this.controls[i];
				this.map.removeControl(control);
				control.destroy();					
			}
			
			this.controls = [];
			
			// destroy the tools panel contained
			this.map.removeControl(this.panel);
			this.panel.destroy();
			
			// erase the vector layer and then destroy it
			this.layer.removeAllFeatures();
			this.map.removeLayer(this.layer);
			this.layer.destroy();			
			
			this.featureAttributes = [];
			
			this.hideEditPopup();
			
			this.active = false;
		}
	},
		
	attachEventListeners: function(){
		this.layer.events.on({
			featureselected: function (event) {
				var feature = event.feature;
				
				// Check if the select control is active, in this case don't show buttons in popup
				var control = this.map.getControlsBy("title", this.selectControlName)[0];
				this.showEditPopup(feature, control.active ? false : true);
			},
			beforefeatureadded: function (event) {
				var feature = event.feature;	
				if(!feature.attributes[this.iconAttribute]){
					feature.attributes[this.iconAttribute] = this.selectedIcon || this.defaultIcon;
				}				
			},
			featureadded: function(event){
				var feature = event.feature;
				
				// Save the feature attribute locally at startup
				if(this.featureAttributes.length < 1){
					for(attribute in feature.attributes){
						this.featureAttributes.push(attribute);
					}
				}
				
				// //////////////////////////////////////////////////////
				// Convert into an array in order to verify if the 
				// feature contains only the selected icon as unique 
				// attribute.
				// //////////////////////////////////////////////////////
				var attributes = $.map(feature.attributes, function(value, index) {
					return [value];
				});
				
				// Populate the new added feature by the user with FeatureType attributes
				if(attributes.length == 1){
					for(var i=0; i<this.featureAttributes.length; i++){
						var attribute = this.featureAttributes[i];
						if(attribute != this.iconAttribute){
							feature.attributes[attribute] = "";
						}
					}
					
					this.showEditPopup(feature, true);
				}
				
				if(this.drawFeature)this.drawFeature.deactivate();
				
			},
			beforefeaturemodified: function(evt){
				this.popup.prevFeature = evt.feature.clone();
			},
            scope: this
		});
	},
	
	showIconListPopup: function(position){
		// Remove the previous popup if already exist
		if($("#iconSelection")){
			$("#iconSelection").remove();
		}		

		// Create and populate the popup to allow the icon selection
		var popupContent = "";
		for(icon in this.iconsList){
			var marker = this.iconsList[icon];
			popupContent += 
				"<tr>" + 
					"<td>" + 
						"<input type=\"radio\" name=\"icon\" value=\"" + marker.url + "\" " + (marker.isDefault ? "checked" : "") + " />" +
					"</td>" + 
					"<td>" + 
						"<img src=\"" + marker.url + "\" />" +
					"</td>" + 
					"<td>" + 
						"<span>(" + marker.name + ")</span>" +
					"</td>" + 
				"</tr>"
		}
		
		$("<div id=\"iconSelection\" class=\"popup\">" +
			"<table id=\"iconTable\">" +
				"<thead>" +
					"<tr>" + 
						'<th colspan=\"4\" class=\"popup_title\" id="popup_title" rowspan="3">' + 
							"Available Icons" +
						"</th>" +
					"</tr>" +
				"</thead>" +
				"<tbody>" +
					popupContent +
				"</tbody>" +
			"</table>" +
		"</div>").appendTo("body"); 			

		$( "#iconSelection" ).draggable();
		
		$('#iconSelection').css('left', position.x);
		$('#iconSelection').css('top', position.y);
		$('#iconSelection').css('display','inline');     
		$("#iconSelection").css("position", "absolute");
		$("#iconSelection").css("z-index", "10000");
		
		$("#iconTable tbody").append( 
			"<button class=\"save_button\" id=\"icon_apply_button\" type=\"button\">Apply</button>"
		);
		
		// ///////////////////////////////////////////////////////////////////////
		// Activate the Draw Point Feature control clicking on 'Apply' button.
		// In the meantime change the SLD with the selected Icon.
		// ///////////////////////////////////////////////////////////////////////
		var me = this;
		$("#icon_apply_button").click(function(){
			me.drawFeature.activate();
			me.selectedIcon = $('input[name=icon]:checked').val();
			me.hideIconsPopup();			
		});		
	},
	
	showEditPopup: function(feature, edit){		
		var centerLonLat = feature.lonlat ? feature.lonlat  : feature.geometry.bounds.getCenterLonLat();
		var location = this.map.getPixelFromLonLat(centerLonLat);
		
		var popupOtps = {
			feature: feature,
			location: location,
			edit: edit
		};
		
		this.popup.show(popupOtps);
	},
	
	hideEditPopup: function(){
		this.popup.hide();
	},
	
	hideIconsPopup: function(){
		$('#iconSelection').css('display','none');
	}
	
});


