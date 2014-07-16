OLTools.Tool.EditPopup = OLTools.Class(OLTools.Tool, {

	/**
	prevFeature:
	*/
	
	feature: null,
	
	featureModified: {
		geometry: false,
		attributes: false,
		saved: false
	},
	
	map: null,
	
    initialize: function(map) {
		this.map = map;
		this.featureModified = {
			geometry: false,
			attributes: false
		};
		
		$("<div id='popup'>" +
			"<table id='tblData'>" +
				"<thead>" +
					"<tr>" + 
						'<th id="popup_title" rowspan="3">' + 
							"Edit Attributes" +
						"</th>" +
					"</tr>" +
				"</thead>" +
				"<tbody>" +
				"</tbody>" +
			"</table>" +
		"</div>").appendTo("body"); 		

		$( "#popup" ).draggable();
	},
	
	show: function(options){
		this.feature = options.feature;
		this.vectorLayer = this.feature.layer;
		
		this.vectorLayer.events.on({
			featuremodified: function(evt){
				this.featureModified.geometry = true;
			},
            scope: this
		});
		
		$('#popup').css('left', options.location.x);
		$('#popup').css('top', options.location.y);
		$('#popup').css('display','inline');     
		$("#popup").css("position", "absolute");
		$("#popup").css("z-index", "10000");
		
		$("#tblData tbody").empty();
		
		for(attribute in this.feature.attributes){
			var value = this.feature.attributes[attribute];
			
		    $("#tblData tbody").append( 
				"<tr>" + 
					"<td>" + 
						"<span>" + attribute + "</span><span>:</span><input class='attribute_field' type='text' value='" + value + "'/>" + 
					"</td>" + 
				"</tr>"
			);		
		}
		
		// Check if the select control is active, in this case don't show buttons in popup
		var editPopup = this;
		if(options.edit === true){
			$("#popup_title").text("Edit Attributes");
			
			$("#tblData tbody").append( 
				"<button id='popup_close_button' type='button'>Close</button>" +
				"<button id='popup_save_button' type='button'>Save</button>"
			);	
			
			$("#popup_close_button").click(function(){
				var evalueatedAttr = 0, axistingAttr = 0;
				for(attribute in editPopup.feature.attributes){
					axistingAttr++;
					if(editPopup.feature.attributes[attribute]){
						evalueatedAttr++;
					}				
				}
				
				//
				// Delete the feature if any attributes has been evaluated
				//
				if(evalueatedAttr < axistingAttr){
					editPopup.vectorLayer.destroyFeatures([editPopup.feature]);
				}else{							
					//
					// Uselect the feature
					//
					var controls = editPopup.map.controls;
					for(var i=0; i<controls.length; i++){
						var control = controls[i];
						if(control.selectControl){
							control.selectControl.unselectAll();
						}
					}	
				
					// Check if the attributes values has been modified to
					for(attribute in editPopup.feature.attributes){					
						$("#tblData span").each(function(index){
							var value = this.innerHTML;
							if(value == attribute){
								if(editPopup.feature.attributes[attribute] != this.nextSibling.nextSibling.value){
									editPopup.featureModified.attributes = true;
								}
							}					
						});
					}
				
					if(editPopup.featureModified.geometry === true || editPopup.featureModified.attributes === true){
						// Ask the user to confirm the modification before save
						var c = confirm("Do you want to save provided modifications before close");
						
						if(!c){
							if(editPopup.featureModified.geometry === true){
								editPopup.vectorLayer.removeFeatures([editPopup.feature]);
								editPopup.vectorLayer.addFeatures([editPopup.prevFeature]);
							}
						}else{
							for(attribute in editPopup.feature.attributes){					
								$("#tblData span").each(function(index){
									var value = this.innerHTML;
									if(value == attribute){
										editPopup.feature.attributes[attribute] = this.nextSibling.nextSibling.value;
									}					
								});
							}
						}
					}
				}		
				
				editPopup.restoreFeatureModified(false);
				editPopup.hide();
			});
			
			$("#popup_save_button").click(function(){
				for(attribute in editPopup.feature.attributes){					
					$("#tblData span").each(function(index){
						var value = this.innerHTML;
						if(value == attribute){
							editPopup.feature.attributes[attribute] = this.nextSibling.nextSibling.value;
						}					
					});
				}
				
				var evalueatedAttr = 0, axistingAttr = 0;
				for(attribute in editPopup.feature.attributes){
					axistingAttr++;
					if(editPopup.feature.attributes[attribute]){
						evalueatedAttr++;
					}				
				}
				
				//
				// Delete the feature if any attributes has been evaluated
				//
				if(evalueatedAttr < axistingAttr){
					// Ask the user to fill the attributes form before save
					alert("Fill the form before save the new feature");
				}else{			
					// Uselect the feature
					var controls = editPopup.map.controls;
					for(var i=0; i<controls.length; i++){
						var control = controls[i];
						if(control.selectControl){
							control.selectControl.unselectAll();
						}
					}
					
					// Ask the user to confirm the modification before save
					var c = confirm("Are you sure to save these modifications");
					
					if(!c){
						editPopup.vectorLayer.removeFeatures([editPopup.feature]);
						if(editPopup.prevFeature){
							editPopup.vectorLayer.addFeatures([editPopup.prevFeature]);
						}
					}
					
					editPopup.restoreFeatureModified(true);
					editPopup.hide();
				}
			});
		}else{
			$("#popup_title").text("Attributes");
			$("[class*='attribute_field']").each(function(index){
				$(this).attr("readonly", true);
			});
			
			$("#tblData tbody").append( 
				"<button id='popup_close_button' type='button'>Close</button>"
			);	
			
			$("#popup_close_button").click(function(){
				editPopup.hide();
			});
		}
		
		this.visible = true;
	},
	
	hide: function(){
		$("#tblData tbody").empty();
		$('#popup').css('display','none');
		
		this.visible = false;
	},
	
	isVisible: function(){
		return this.visible;
	},
	
	restoreFeatureModified: function(saved){
		this.featureModified.geometry = false;
		this.featureModified.attributes = false;
		this.featureModified.saved = saved;
	}
	
});
