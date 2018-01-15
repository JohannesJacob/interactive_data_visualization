function drawMap() {

    // Center Coordinates (ca. Paris) and max. zoom:
    home_lat=50;
    home_long=2;
    home_zoom=4;
    max_zoom=19;


    // Initialise Map at predefined Center ("home"):
    // "zoomControl: false" to avoid the default zoom buttons
    MAP = L.map('mapid', {zoomControl: false})
        .setView([home_lat, home_long], home_zoom);

    // Now add Zoom button in top-right corner:
    L.control.zoom({position: "topright"}).addTo(MAP);

    // Add Home Button to the map (leads you back to initial map layout):
    L.easyButton('<span>&starf;</span>', function (map) {
        map.setView([home.lat, home.lng], home.zoom);}, 'Zoom To Home').addTo(MAP);


    // Add tile layer to map and the source of the leaflet:
    // Zoom is set to 4-19 so that Europe is displayed nicely.
    // subdomains: "abcd" ??

    var CartoDB_Positron = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy;' +
        '<a href="http://cartodb.com/attributions">CartoDB</a>', maxZoom: max_zoom, minZoom: home_zoom})
        .addTo(MAP);


    // Initialize the SVG layer
    SVG = d3.select(MAP.getPanes().overlayPane).append("svg")
        .append("g").attr("class", "leaflet-zoom-hide");


}


function drawPoints() {

    // Make radius size dependent on the number of killed people:
    var radiusScale = d3.scaleSqrt()
        .domain([0, 300])
        .range([6, 30]);


    var svg = d3.select("svg");
    var g = d3.select("svg g");
    var circles = d3.select("svg g").selectAll("circle")
        // filter() returns the data that are permitted by the filters
        .data(filter())
        .style("opacity", .85)
        .style("fill", function(d){
            return cat_col_dic[d.attacktype];
        })
        .style("stroke", "black")
        .attr("r", function(d){
            var killed = ((typeof(d.nkill) == "undefined") || Number.isNaN(d.nkill)) ? 0 : d.nkill;
            return radiusScale(killed);});    // UPDATE

    //console.log(circles.size());
    //console.log(circles.exit().size());
    //console.log(circles.enter().size());

    circles.enter()            // ENTER
        .append("circle")
        .style("opacity", .85)
        .style("fill", function(d){
            return cat_col_dic[d.attacktype];
        })
        .style("stroke", "black")
        .attr("r", function(d){
            var killed = ((typeof(d.nkill) == "undefined") || Number.isNaN(d.nkill)) ? 0 : d.nkill;
            return radiusScale(killed);});

    circles.exit().remove();    // EXIT

    init_tooltips();
    init_infobox();

    function zoom_update() {
        g.selectAll("circle")
            .attr("cx", function (d) {
                return MAP.latLngToLayerPoint(d.LatLng).x;
            })
            .attr("cy", function (d) {
                return MAP.latLngToLayerPoint(d.LatLng).y;
            });

        var bbox = svg.node().getBBox();
        var margin = 50;
        svg.attr("width", bbox.width+margin)
            .attr("height", bbox.height+margin)
            .attr("left", bbox.x+"px")
            .attr("top", bbox.y+"px");
    }

    MAP.on("zoom", zoom_update);
    zoom_update();
}


function init_tooltips() {
    // Tooltips: Define the div for the tooltip (transparent first, later visible)
    var div = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Tooltips Interactivity:
    var circles = d3.select("svg g").selectAll("circle");

    circles.on("mouseover", function(d){
        // make selected dot more opaque
        d3.select(this).style("stroke-width", 2);

        // increase opacity of selected tooltip object (i.e., make visible):
        div.transition()
            .duration(0.001)
            .style("opacity", .95);
        // write out info in a box that is placed in top-right from dot
        div.html("Location: " + d.city + ", " + d.country_txt + "<br>"
                +"Date:     " + d.imonth +"/" + d.iday + "/" + d.iyear + "<br>"
                +"Type:     " + d.attacktype1_txt + "<br>"
                +"Killed:   " + d.nkill)
            .style("left", (d3.event.pageX + 15) + "px")
            .style("top", (d3.event.pageY - 100) + "px")
        });

        // make dot small again and remove tool tips (visibility):
        circles.on("mouseout", function(d) {
            d3.select(this).style("stroke-width", 1);
            div.transition()
                .duration(0.01)
                .style("opacity", 0);
    });
}


function init_infobox(){
    // Define div for infos of selected point
    var div = d3.select("#infobox")
        .append("div")
        .attr("class", "infos");

    var circles = d3.select("svg g").selectAll("circle");


    // Infobox Interactivity:
    circles.on("click", function(d){
        //Deselect all previous circles
        d3.selectAll("#mapid svg circle")
          .style("fill", function(d, i){return cat_col_dic[d.attacktype]})
          .style("stroke-width", 1);
        // Color selected circles
        d3.select(this)
          .style("opacity", 1)
          .style("fill", "black")
          .style("stroke", "black")
          .style("stroke-opacity", 1)
          .style("stroke-width", 4);
        // Write into Infobox
        div.html("<b>Target:</b> " + d.target1 + "<br>" +
                 "<b>Perpetrator:</b> " + d.terrorist + "<br>" +
                 "<b>Type:</b> " + d.attacktype1_txt + "<br>" +
                 "<b>Weapon:</b> " + d.weapsubtype1_txt + "<br>" +
                 "<b>No. killed:</b> " + d.nkill + "<br><br>" +
                 "<b>Summary:</b> " +"<br>" + d.summary
                 );
    });
}

