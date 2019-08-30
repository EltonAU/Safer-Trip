var mymap;

var SignIcon = L.Icon.extend({
    options: {
        iconSize:     [30, 40],
        shadowSize:   [50, 64],
        iconAnchor:   [15, 30],
        shadowAnchor: [4, 62],
        popupAnchor:  [0, 0]
    }
});

var congestion = new SignIcon({iconUrl: '../images/congestion.png'}),
    crash = new SignIcon({iconUrl: '../images/crash.png'}),
    flood = new SignIcon({iconUrl: '../images/flood.png'}),
    hazard = new SignIcon({iconUrl: '../images/hazard.png'}),
    roadwork = new SignIcon({iconUrl: '../images/roadwork.png'}),
    specialevent = new SignIcon({iconUrl: '../images/specialevent.png'});

function getSomething(){
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            x.innerHTML = "Geolocation is not supported by this browser.";
        }
    }
    function showPosition(position) {
        mymap  = L.map('map').setView([position.coords.latitude, position.coords.longitude], 13);

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoieGVyb3VsYXgiLCJhIjoiY2ptM3NrNGNpMWI5ODNxcG5xcnBrN2h2NCJ9.vl634kCWD65IZcWPNSDCoQ'
        }).addTo(mymap);

        mymap.on('click', onMapClick);

        function onMapClick(e) {
            requestData(e.latlng.lat, e.latlng.lng, document.getElementById("radius").value);
        }

        requestData(position.coords.latitude, position.coords.longitude, document.getElementById("radius").value);
    }
    getLocation();
    


}
var rec;
var controls = [];


function requestData(lat, lng, meter){
    document.getElementById("result").innerHTML ="Getting data from server...";
    clearMarkers();
    meter *= 1000;
    var corner1 = getNewLatLng(lat, lng, meter);
    var corner2 = getNewLatLng(lat, lng, -meter);
    var box = L.latLngBounds(corner1, corner2);

    rec = L.rectangle(box, {color: "#ff7800", weight: 1}).addTo(mymap);
    mymap.fitBounds(box);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "http://localhost:3000/loc?"+"lat1="+box.getNorth()+"&lng1="+box.getWest()+
                                                "&lat2="+box.getSouth()+"&lng2="+box.getEast(), true);
    xhr.send();
    xhr.onreadystatechange = processRequest;

    function processRequest(e) {
        if (xhr.readyState == 4 && xhr.status == 200) {
            if(xhr.responseText == "Error"){
                alert("Fail to get data");
                return;
            }
            var response = JSON.parse(xhr.responseText);
            var length = response.features.length;
            var inc = response.features;
            

            for (i = 0; i < length; i++) {
                var pos = inc[i].geometry.geometries[0];
                var prop = inc[i].properties;
                var eventType = prop.event_type;
                var icon;
                if(eventType == "Hazard"){
                    icon = hazard;
                }else if(eventType == "Crash"){
                    icon = crash;
                }else if(eventType == "Congestion"){
                    icon = congestion;
                }else if(eventType == "Roadworks"){
                    icon = roadwork;
                }else if(eventType == "Special event"){
                    icon = specialevent;
                }else if(eventType == "Flooding"){
                    icon = flood;
                }
                
                if(pos.coordinates[0][0] == null){
                    
                    let marker = L.marker([pos.coordinates[1], pos.coordinates[0]], {icon: icon}).addTo(mymap);
                   
                    marker.bindPopup("<b>Type: " +eventType + 
                            "</b> <br><br> Delay: " + (prop.impact.delay == null ? "Unknown" : prop.impact.delay) + 
                            "<br><br>Start Time: " +(prop.duration.start == null ? "Unknown" : prop.duration.start) + 
                            "<br>End Time: " + (prop.duration.end == null ? "Unknown" : prop.duration.end) + 
                            "<br><br>Description: <br>" + (prop.description == null ? "Unknown" : prop.description) +
                            "<br><br>Full Information: <br>" + (prop.information == null ? "Unknown" : prop.information) +
                            "<br><br>Advice: " + (prop.advice == null ? "Unknown" : prop.advice)  );
                    controls.push(marker);
                }else{
                    let polyline = L.polyline([]);
                    var avgLat = 0;
                    var avgLng = 0;
                    var totalLat = 0;
                    var totalLng = 0;
                    for(j = 0; j < pos.coordinates.length; j++){
                        totalLat += pos.coordinates[j][1];
                        totalLng += pos.coordinates[j][0];
                        polyline.addLatLng([pos.coordinates[j][1], pos.coordinates[j][0]]);
                    }
                    avgLat = totalLat / pos.coordinates.length;
                    avgLng = totalLng / pos.coordinates.length;
                    let marker = L.marker([avgLat,avgLng], {icon: icon}).addTo(mymap);
                    marker.bindPopup("<b>Type: " +eventType + 
                            "</b> <br><br> Delay: " + (prop.impact.delay == null ? "Unknown" : prop.impact.delay) + 
                            "<br><br>Start Time: " +(prop.duration.start == null ? "Unknown" : prop.duration.start) + 
                            "<br>End Time: " + (prop.duration.end == null ? "Unknown" : prop.duration.end) + 
                            "<br><br>Description: <br>" + (prop.description == null ? "Unknown" : prop.description) +
                            "<br><br>Information: <br>" + (prop.information == null ? "Unknown" : prop.information) +
                            "<br><br>Advice: " + (prop.advice == null ? "Unknown" : prop.advice)  );
                    controls.push(marker);
                    polyline.addTo(mymap);
                    controls.push(polyline);
                }
            }
            document.getElementById("result").innerHTML ="Markers are drawn!";
            setTimeout(function(){
                document.getElementById("result").innerHTML ="Waiting user input";
            }, 5000);
        }
    }
}

function searchByKeywords(){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "http://localhost:3000/key?keyword=" + document.getElementById("text_input").value);
    xhr.send();
    
    xhr.onreadystatechange = processKeyword;
    function processKeyword(e){
        if(xhr.responseText == "Error"){
            alert("Cannot get data");
            return;
        }
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            if(response.error != null){
            }else{
                requestData(response.lat, response.lon, document.getElementById("radius").value);
            }
        }
    }
}

function clearMarkers(){
    if(rec != null){
        rec.remove();
    }
    for(j = controls.length-1; j >= 0; j--){
        controls[j].remove();
    }
}

function openMenu() {
    document.getElementById("button-wrapper").style.height = "50%";
    document.getElementById("button-wrapper").style.width = "20%";
    document.body.style.backgroundColor = "white";
}

function myFunction() {
    setTimeout(function(){
        document.getElementById("button-wrapper").style.visibility = "visible";
    }, 1000);
}

function showPage() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("button-wrapper").style.visibility = "visible";
    document.getElementById("myDiv").style.display = "block";
  }

function closeMenu() {
    document.getElementById("button-wrapper").style.height = "30%";
    document.getElementById("button-wrapper").style.width = "10%";
    
    document.body.style.backgroundColor = "white";
}

function getNewLatLng(lat, lng, dis){
    var coef = dis * 0.0000089;
    var new_lat = parseFloat(lat) + coef;
    var new_long = parseFloat(lng) + coef / Math.cos(lat * 0.018);
    return L.latLng(new_lat, new_long);
}
