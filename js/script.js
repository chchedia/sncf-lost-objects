
//create a map with paris is the center 
var paris = [48.866667, 2.333333];
var mymap = L.map('mapid').setView(paris, 13);

//add a layer
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    id: 'mapbox.streets'
}).addTo(mymap);

var loadedGares = [],
    markers= [],
    typesFilter;
// display train station in the map with type object filter
function displayMapGares(mymap, typesF) {
    // bounds contain the geographical bounds visible in the current map view
    var bounds = mymap.getBounds();
    //create polygone for the geofilterPolygon filtre
    var geofilterPolygon = "(" + bounds._northEast.lat + "," + bounds._northEast.lng + "),(" + bounds._southWest.lat + "," + bounds._northEast.lng + ")," +
        "(" + bounds._southWest.lat + "," + bounds._southWest.lng + "),(" + bounds._southWest.lat + "," + bounds._southWest.lng + ")";
    geofilterPolygon = encodeURIComponent(geofilterPolygon);
    var garesRequestUrl = 'https://data.sncf.com/api/records/1.0/search/?dataset=liste-des-gares&geofilter.polygon=' + geofilterPolygon + '&rows=100';

    const garesRequest = new XMLHttpRequest();
    garesRequest.open('GET', garesRequestUrl, false);
    garesRequest.send(null);

    if (garesRequest.status === 200) {
        var responseGares = JSON.parse(garesRequest.responseText);
        var gares = responseGares.records;
        gares.map(function (gare) {
            var gareId = gare.fields.code_uic;

            if (!~loadedGares.indexOf(gareId)) {
                loadedGares.push(gareId);
                lostObjects = getLostObjectsByGare(gareId, typesF);
                var coorGare = gare.fields.coordonnees_geographiques;             
                markers.push(L.marker(coorGare)
                    .bindPopup(gare.fields.libelle_gare + '(' + lostObjects.nhits + ')')
                    .addTo(mymap));

            }
        });

    } else {
        console.log("gares api problem" + garesRequest.status + garesRequest.statusText);
    }
}

function getLostObjectsByGare(gareId, filter) {
    objectsRequestUrl = 'https://data.sncf.com/api/records/1.0/search/?dataset=objets-trouves-restitution&refine.gc_obo_gare_origine_r_code_uic_c=00' + gareId;
    if (filter) {
        objectsRequestUrl += '&refine.gc_obo_type_c=' + filter;
    }
    console.log(objectsRequestUrl);
    const objectsRequest = new XMLHttpRequest();
    objectsRequest.open('GET', objectsRequestUrl, false);
    objectsRequest.send(null);
    if (objectsRequest.status === 200) {
        var responseObjects = JSON.parse(objectsRequest.responseText);
        return responseObjects;
    } else {
        throw new Error('data objects api problem' + objectsRequest.status + objectsRequest.statusText);
    }

}

document.getElementById("type").addEventListener("change", function () {
    typesFilter = this.value;
    loadedGares = [];
    // remove markers from map
    markers.map(function(marker){
        marker.remove();
    });
    //remove markers references
    markers =[];
    displayMapGares(mymap, typesFilter);
}, false);


displayMapGares(mymap, typesFilter);

mymap.on('moveend', displayMapGares.bind(this, mymap, typesFilter));




