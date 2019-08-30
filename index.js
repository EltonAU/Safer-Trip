var http = require('http');
var express = require('express');
var request = require('request');
var path = require('path')
var app = express()


app.use(express.static(path.join(__dirname + '/public')));

var server =http.createServer(app);
server.listen(3000);

app.set('port', 3000);

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname + '/html/home.html'));
});

app.get('/key', function(req, res){
  request({url: 'https://api.locationiq.com/v1/autocomplete.php?key=61a772f86e3418&q='+req.query.keyword+
   '&limit=10&viewbox=138.43841493129733,-14.321164908037137,155.68405330181125,-38.4755730834033'}, function(error, response, body){
    if(!error && res.statusCode === 200){
      try{
        var result = JSON.parse(body);
        var length = result.length;
        var stringRes;
        for (i = 0; i < length; i++) {
          if(result[i].address.country == "Australia"){
            stringRes = result[i];
            break;
          }
        }
        if(stringRes == null){
          stringRes = result[0];
        }
        //console.log(stringRes);
        res.send(stringRes);
      }catch(err){
        res.send("Error");
      }
    } 
    else{
      res.send("Error");
    }
   });
});

app.get('/loc', function(req, res){
  request({url: 'https://api.qldtraffic.qld.gov.au/v1/events?apikey=3e83add325cbb69ac4d8e5bf433d770b'}, function(error, response, body){
    if(!error && res.statusCode === 200){
      //console.log(body);
      try{
        var result = JSON.parse(body);
      
      var length = result.features.length;
      var lat1 = req.query.lat1;
      var lng1 = req.query.lng1;
      var lat2 = req.query.lat2;
      var lng2 = req.query.lng2;

      //console.log(lat1 + " - " + lng1 + " : " + lat2 + " - " + lng2);

      var finalIndex = [];
      for (i = 0; i < length; i++) {
        var pos = result.features[i].geometry.geometries[0];
        if(pos.coordinates[0][0] == null){
          var lat = pos.coordinates[1];
          var lng = pos.coordinates[0];
          if(lat <= lat1 && lat >= lat2 && lng >= lng1 && lng <= lng2){
            continue;
          }else{
            finalIndex.push(i);
          }
        }else{
          var found = false;
          for(j = 0; j < pos.coordinates.length; j++){
            var lat = pos.coordinates[j][1];
            var lng = pos.coordinates[j][0];
            if(lat <= lat1 && lat >= lat2 && lng >= lng1 && lng <= lng2){
              found = true;
              break;
            }
          }
          if(!found){
            finalIndex.push(i);
          }
        }
      }

      for (i = finalIndex.length - 1; i >= 0; i--) {
        result.features.splice(finalIndex[i], 1);
      }

      


      var finalResult = JSON.stringify(result);

      res.send(finalResult);
      }catch(err){
        res.send("Error");
    } 
    }
    else{
      res.send("Error");
    } ;
  });
});