/**
 * @requires OpenLayers/Renderer/SVG.js
 */
OpenLayers.Renderer.SVGExtended = OpenLayers.Class(OpenLayers.Renderer.SVG, {

    eraseGeometry: function(geometry, featureId) {
        this.removeArrows(geometry, "svg");
        return OpenLayers.Renderer.SVG.prototype.eraseGeometry.apply(this, arguments);
    },

    drawFeature: function(feature, style) {
        if (feature.geometry) {
            this.removeArrows(feature.geometry, "svg");
        }
        return OpenLayers.Renderer.SVG.prototype.drawFeature.apply(this, arguments);
    },

    /**
     * Method: drawLineString
     * Method which extends parent class by also drawing an arrow in the middle
     * of the line to represent it's orientation.
     */
    drawLineString: function(node, geometry) {	
        this.drawArrows(geometry, node._style);
		
		if(node._style.strokeLineJoinRadius){
			var componentsResult = this.getComponentsPath(geometry.components, node._style);
			
			if (componentsResult) {
				node.setAttributeNS(null, "d", componentsResult);
				return node;  
			} else {
				return false;
			}
		}else{
			return OpenLayers.Renderer.SVG.prototype.drawLineString.apply(this, arguments);
		}
    },
	
	/** 
     * Method: getComponentString
     * 
     * Parameters:
     * components - {Array(<OpenLayers.Geometry.Point>)} Array of points
     * separator - {String} character between coordinate pairs. Defaults to ","
     * 
     * Returns:
     * {Object} hash with properties "path" (the string created from the
     *     components and "complete" (false if the renderer was unable to
     *     draw all components)
     */
    getComponentsPath: function(components, style) {
        var len = components.length;
		
		var radius = style.strokeLineJoinRadius || undefined;
		
		var d = "";
		
		var start = this.getShortString(components[0]).split(",");
        var x = parseFloat(start[0]);
        var y = parseFloat(start[1]);		
		
		d += "M" + x + " " + y;
		
        for(var i=1; i<len; i++) {
			if(i+1 < len && radius){
				var ptPrev = this.getShortString(components[i - 1]).split(",");
				var pt = this.getShortString(components[i]).split(",");
				var ptNext = this.getShortString(components[i + 1]).split(",");
				
				ptPrev[0] = parseFloat(ptPrev[0]);
				ptPrev[1] = parseFloat(ptPrev[1]);
				pt[0] = parseFloat(pt[0]);
				pt[1] = parseFloat(pt[1]);
				ptNext[0] = parseFloat(ptNext[0]);
				ptNext[1] = parseFloat(ptNext[1]);			
				
				var firstPointX = pt[0] - radius * (pt[0] - ptPrev[0]);
				var firstPointY = pt[1] - radius * (pt[1] - ptPrev[1]);
				
				// ///////////////////////////////////////////////////////
				// Calculate a percentage of tow segments as 
				// radius before calculating new intermediate points
				// ///////////////////////////////////////////////////////
				var secondPointX = ptNext[0] - radius * (ptNext[0] - pt[0]);
				var secondPointY = ptNext[1] - radius * (ptNext[1] - pt[1]);
				
				// place the point
				d += " L" + firstPointX + " " + firstPointY;
				
				// calculate the curve
				d += " Q " + pt[0] + " " + pt[1] + " " + secondPointX + " " + secondPointY + " ";
			}else{
				var pt = this.getShortString(components[i]).split(",");
				pt[0] = parseFloat(pt[0]);
				pt[1] = parseFloat(pt[1]);
				d += " L" + pt[0] + " " + pt[1];
			}		
		}

        return d;
    },
	
	/** 
     * Method: getNodeType 
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * style - {Object}
     * 
     * Returns:
     * {String} The corresponding node type for the specified geometry
     */
    getNodeType: function(geometry, style) {
        var nodeType = null;
        switch (geometry.CLASS_NAME) {
            case "OpenLayers.Geometry.Point":
                if (style.externalGraphic) {
                    nodeType = "image";
                } else if (this.isComplexSymbol(style.graphicName)) {
                    nodeType = "svg";
                } else {
                    nodeType = "circle";
                }
                break;
            case "OpenLayers.Geometry.Rectangle":
                nodeType = "rect";
                break;
            case "OpenLayers.Geometry.LineString":
                nodeType = style.strokeLineJoinRadius ? "path" : "polyline";
                break;
            case "OpenLayers.Geometry.LinearRing":
                nodeType = "polygon";
                break;
            case "OpenLayers.Geometry.Polygon":
            case "OpenLayers.Geometry.Curve":
                nodeType = "path";
                break;
            default:
                break;
        }
		
        return nodeType;
    }
	
});

/**
 * @requires OpenLayers/Renderer/Canvas.js
 */
OpenLayers.Renderer.CanvasExtended = OpenLayers.Class(OpenLayers.Renderer.Canvas, {

    eraseGeometry: function(geometry, featureId) {
        this.removeArrows(geometry);
        return OpenLayers.Renderer.Canvas.prototype.eraseGeometry.apply(this, arguments);
    },

    drawFeature: function(feature, style) {
        if (feature.geometry) {
            this.removeArrows(feature.geometry);
        }
        return OpenLayers.Renderer.Canvas.prototype.drawFeature.apply(this, arguments);
    },

    /**
     * Method: drawLineString
     * Method which extends parent class by also drawing an arrow in the middle
     * of the line to represent it's orientation.
     */
    drawLineString: function(geometry, style) {
        this.drawArrows(geometry, style);
        return OpenLayers.Renderer.Canvas.prototype.drawLineString.apply(this, arguments);
    },
	
	/**
     * Method: renderPath
     * Render a path with stroke and optional fill.
     */
    renderPath: function(context, geometry, style, featureId, type) {
        var components = geometry.components;
        var len = components.length;
        context.beginPath();
        var start = this.getLocalXY(components[0]);
        var x = start[0];
        var y = start[1];
		
		var radius = style.strokeLineJoinRadius || undefined;
		
        if (!isNaN(x) && !isNaN(y)) {
            context.moveTo(start[0], start[1]); // set the first point
            for (var i=1; i<len; ++i) {
				if(i+1 < len && radius){
					var ptPrev = this.getLocalXY(components[i - 1]);
					var pt = this.getLocalXY(components[i]);
					var ptNext = this.getLocalXY(components[i + 1]);
					
					var firstPointX = pt[0] - radius * (pt[0] - ptPrev[0]);
					var firstPointY = pt[1] - radius * (pt[1] - ptPrev[1]);
					
					// ///////////////////////////////////////////////////////
					// Calculate a percentage of tow segments as 
					// radius before calculating new intermediate points
					// ///////////////////////////////////////////////////////
					var secondPointX = ptNext[0] - radius * (ptNext[0] - pt[0]);
					var secondPointY = ptNext[1] - radius * (ptNext[1] - pt[1]);
					
					// place the point
					context.lineTo(firstPointX, firstPointY);
					
					// calculate the curve
					context.quadraticCurveTo(pt[0], pt[1], secondPointX, secondPointY);					
				}else{
					var pt = this.getLocalXY(components[i]);
					context.lineTo(pt[0], pt[1]);
				}		                
            }
            if (type === "fill") {
                context.fill();
            } else {
                context.stroke();
            }
        }
    }
});

/**
 * @requires OpenLayers/Renderer/VML.js
 */
OpenLayers.Renderer.VMLExtended = OpenLayers.Class(OpenLayers.Renderer.VML, {

    eraseGeometry: function(geometry, featureId) {
        this.removeArrows(geometry);
        return OpenLayers.Renderer.VML.prototype.eraseGeometry.apply(this, arguments);
    },

    drawFeature: function(feature, style) {
        if (feature.geometry) {
            this.removeArrows(feature.geometry);
        }
        return OpenLayers.Renderer.VML.prototype.drawFeature.apply(this, arguments);
    },

    /**
     * Method: drawLineString
     * Method which extends parent class by also drawing an arrow in the middle
     * of the line to represent it's orientation.
     */
    drawLineString: function(node, geometry) {
        this.drawArrows(geometry, node._style);
        return OpenLayers.Renderer.VML.prototype.drawLineString.apply(this, arguments);
    }
});

OpenLayers.Renderer.prototype.removeArrows = function(geometry) {
	// ///////////////////////////////////
    // Remove any arrow already drawn
    // FIXME may be a performance issue
	// ///////////////////////////////////
	var root;
	if(this.rendererRoot && this.rendererRoot.tagName == "svg"){
		root = this.vectorRoot;
	}else{
		root = this.root;  // used root instead vectorRoot as before because undefined for Canvas
	}
	
    var children = root.childNodes;
	var arrowsToRemove = [];
	
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.id.indexOf(geometry.id + "_arrow") != -1) {
            arrowsToRemove.push(child);
        }
    }
	
    for (var i = 0; i < arrowsToRemove.length; i++) {
        root.removeChild(arrowsToRemove[i]);
    }
};

OpenLayers.Renderer.prototype.drawArrows = function(geometry, style) {
    var i;
    if (style.orientation) {
        var pts = geometry.components;
        var prevArrow,
            distance;
        for (i = 0, len = pts.length; i < len - 1; ++i) {
            var prevVertex = pts[i];
            var nextVertex = pts[i + 1];
            var x = (prevVertex.x + nextVertex.x) / 2;
            var y = (prevVertex.y + nextVertex.y) / 2;
            var arrow = new OpenLayers.Geometry.Point(x, y);

            arrow.id = geometry.id + '_arrow_' + i;
            style = OpenLayers.Util.extend({}, style);
            style.graphicName = "arrow";
            style.pointRadius = 4;
            style.rotation = this.getOrientation(prevVertex, nextVertex);

            if (prevArrow) {
                var pt1 = this.map.getPixelFromLonLat(new OpenLayers.LonLat(arrow.x, arrow.y)),
                    pt2 = this.map.getPixelFromLonLat(new OpenLayers.LonLat(prevArrow.x, prevArrow.y)),
                    w = pt2.x - pt1.x,
                    h = pt2.y - pt1.y;
                distance = Math.sqrt(w*w + h*h);
            }
			
			// ////////////////////////////////////////////////////////////////
            // Don't draw every arrow, ie. ensure that there is enough space
            // between two.
			// ////////////////////////////////////////////////////////////////
            if (!prevArrow || distance > 40) {
                this.drawGeometry(arrow, style, arrow.id);
                prevArrow = arrow;
            }
        }
    }
};

OpenLayers.Renderer.prototype.getOrientation = function(pt1, pt2) {
    var x = pt2.x - pt1.x;
    var y = pt2.y - pt1.y;

    var rad = Math.acos(y / Math.sqrt(x * x + y * y));
    // negative or positive
    var factor = x > 0 ? 1 : -1;

    return Math.round(factor * rad * 180 / Math.PI);
};

OpenLayers.Renderer.symbol.arrow = [0, 2, 1, 0, 2, 2, 1, 0, 0, 2];