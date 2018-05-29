//create a map with lille in the center 
var lille = [50.6889386, 3.0983138],
    mymap = L.map('mapid').setView(lille, 12),
    markers = {},
    nblost,
    typeObjectFilter,
    gares = getListGares(mymap),
    lostObjectsMap = getAllGaresLostObjects(gares);

/**
 * initialisation
 */

//add a layer
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    id: 'mapbox.streets'
}).addTo(mymap);

displayMapGares(mymap, gares, lostObjectsMap);

/**
 * display gares in the map
 * @param {*} mymap 
 * @param {*} gares 
 * @param {*} lostObjects 
 */
function displayMapGares(mymap, gares, lostObjects) {
    gares.map(function (gare) {
        var gareId = gare.fields.code_uic,
            recordId = gare.recordid;
        //if the train station does not already loaded
        var coorGare = gare.fields.coordonnees_geographiques;
        markers[recordId] = L.marker(coorGare)
            .bindPopup(gare.fields.libelle_gare + '(' + lostObjects[gareId].nhits + ')')
            .addTo(mymap);
    });
}
/**
 * display and hide markers
 * @param {*} gares 
 * @param {*} nblost 
 * @param {*} lostObjectsMap 
 * @param {*} markers 
 */
function filterDispalyGare(gares, nblost, lostObjectsMap, markers) {
    gares.map(function (gare) {
        var gareId = gare.fields.code_uic,
            recordId = gare.recordid;
        if (lostObjectsMap[gareId].nhits < nblost) {
            markers[recordId].setOpacity(0);
        } else {
            markers[recordId].setOpacity(1);
        }
    });
}

/**
 *  retreive gare list from api and map position
 * @param {*} map 
 */
function getListGares(map) {
    // bounds contain the geographical bounds visible in the current map view
    var bounds = map.getBounds();
    //create polygone for the geofilterPolygon filtre
    var geofilterPolygon = "(" + bounds._northEast.lat + "," + bounds._northEast.lng + "),(" + bounds._southWest.lat + "," + bounds._northEast.lng + ")," +
        "(" + bounds._southWest.lat + "," + bounds._southWest.lng + "),(" + bounds._southWest.lat + "," + bounds._southWest.lng + ")";
    geofilterPolygon = encodeURIComponent(geofilterPolygon);
    var garesRequestUrl = 'https://data.sncf.com/api/records/1.0/search/?dataset=liste-des-gares&geofilter.polygon=' + geofilterPolygon + '&rows=100';
    //send request
    const garesRequest = new XMLHttpRequest();
    garesRequest.open('GET', garesRequestUrl, false);
    garesRequest.send(null);

    if (garesRequest.status === 200) {
        //convert the results to JSON
        var responseGares = JSON.parse(garesRequest.responseText);
        return responseGares.records;
    } else {
        console.log("gares api problem" + garesRequest.status + garesRequest.statusText);
    }
}

/**
 * retrieve the lost objects by gareId
 * @param {*} gareId 
 * @param {*} filter 
 */
function getLostObjectsByGare(gareId, filter) {
    objectsRequestUrl = 'https://data.sncf.com/api/records/1.0/search/?dataset=objets-trouves-restitution&refine.gc_obo_gare_origine_r_code_uic_c=00' + gareId;
    if (filter) {
        objectsRequestUrl += '&refine.gc_obo_type_c=' + filter;
    }
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

/**
 * retrieve all gares lost objects
 * @param {*} gares 
 * @param {*} filter 
 */
function getAllGaresLostObjects(gares, filter) {
    return gares.reduce(function (acc, gare) {
        var gareId = gare.fields.code_uic;
        acc[gareId] = getLostObjectsByGare(gareId, filter);
        return acc;
    }, {});
}

/**
 * remove markers
 * @param {*} gares 
 * @param {*} markers 
 */
function removeAllMarkers(gares, markers) {
    gares.map(function (gare) {
        var recordId = gare.recordid;
        markers[recordId].remove();
    });
}

//event listener on type change
document.getElementById("type").addEventListener("change", function () {
    typeObjectFilter = this.value;
    lostObjectsMap = getAllGaresLostObjects(gares, this.value);
    removeAllMarkers(gares, markers);
    displayMapGares(mymap, gares, lostObjectsMap);
    filterDispalyGare(gares, nblost, lostObjectsMap, markers);
}, false);

//event listener on number of lost objects
document.getElementById("nblost").addEventListener("change", function () {
    nblost = this.value;
    filterDispalyGare(gares, nblost, lostObjectsMap, markers);
}, false);

//event on moving map
mymap.on('moveend', function () {
    removeAllMarkers(gares, markers);
    gares = getListGares(mymap);
    lostObjectsMap = getAllGaresLostObjects(gares, typeObjectFilter);
    displayMapGares(mymap, gares, lostObjectsMap);
    filterDispalyGare(gares, nblost, lostObjectsMap, markers);
});




