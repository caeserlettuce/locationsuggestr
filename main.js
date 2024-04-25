// lat and lng bounds:
// lat: -90, 90
// lng: -180, 180

var map;
var mapid = "9bd2e77c7cbe837c";
var map_default_loc = [0, 0];
var category_playing;
var suggestion_loc = false;
var suggestion_markers = [];
var sv;
var find_coords_interval;
var find_pano_interval;
var real_loc;
var allow_suggest = false;
var gamesave_save = [];
var miles = true;
var time_start;
var reflection_map;
var reflection_markers = [];
var polygon_points = [];
var real_polygon_points = [];
var polygon_maker = false;
var polygon_markers = [];
var map_polygon;
var tried_locations = 0;
var found_coords = false;
var found_loc = false;
var bounds_stuff;
var panorama
var hours_checked = false;
var hours_exist = true;
var hours_exist = false;
var fancy_hours;
var fancy_minutes;
var fancy_seconds;
var prev_fancy_hours;
var prev_fancy_minutes;
var prev_fancy_seconds;
var fancy_time_interval;
var fancy_time_seconds = 0;


for (i in categories) {
  var category_node = document.querySelector(".template.category").cloneNode(true);
  category_node.classList.remove("template");
  category_node.querySelector("img").setAttribute("src", `${categories[i]["img"]}`);
  category_node.querySelector("h2").innerHTML = `${categories[i]["name"]}`;
  category_node.setAttribute("onclick", `play_category(${i})`);
  document.querySelector(".game-categories").appendChild(category_node);
}

function ray_casting(point, polygon) {
  var n = polygon.length,
  is_in = false,
  x = point["lat"],
  y = point["lng"],
  x1, x2, y1, y2;

  for(var i=0; i < n-1; ++i){
    x1=polygon[i]["lat"];
    x2=polygon[i+1]["lat"];
    y1=polygon[i]["lng"];
    y2=polygon[i+1]["lng"];

    if(y < y1 != y < y2 && x < (x2-x1) * (y-y1) / (y2-y1) + x1){
      is_in=!is_in;
    }
  }

  return is_in;
}

function haversine_distance(mk1, mk2) {
  var R = 3958.8; // Radius of the Earth in miles
  var rlat1 = mk1["lat"] * (Math.PI/180); // Convert degrees to radians
  var rlat2 = mk2["lat"] * (Math.PI/180); // Convert degrees to radians
  var difflat = rlat2-rlat1; // Radian difference (latitudes)
  var difflon = (mk2["lng"]-mk1["lng"]) * (Math.PI/180); // Radian difference (longitudes)

  var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
  return d;
}

// function processSVData(data, status) {
//   if (status == google.maps.StreetViewStatus.OK) {
//     var marker = new google.maps.Marker({
//       position: ,
//       map: map,
//       title: data.location.description
//     });

//     panorama.setPano(data.location.pano);
//     panorama.setPov({
//       heading: 270,
//       pitch: 0
//     });
//     panorama.setVisible(true);

//     google.maps.event.addListener(marker, 'click', function() {

//       var markerPanoID = data.location.pano;
//       // Set the Pano to use the passed panoID
//       panorama.setPano(markerPanoID);
//       panorama.setPov({
//         heading: 270,
//         pitch: 0
//       });
//       panorama.setVisible(true);
//     });
//   } else {
//     alert('Street View data not found for this location.');
//   }
// }


function do_street_view(loc) {

  // make it do the thing lmao
  var coordinates_tm = {"lat": loc[0], "lng": loc[1]};

  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano"), {
      position: coordinates_tm,
      pov: {
        heading: 34,
        pitch: 10,
      },
    }
  );

  var pano_loc = panorama.getPosition().toJSON();
  console.log(pano_loc)
  real_loc = [pano_loc["lat"], pano_loc["lng"]];  // this makes sure that if the panorama is like WAY off from the random point that it'll correct it and itll be fine


  //map.setStreetView(panorama);
}

function initMap() {
  try {
    sv = new google.maps.StreetViewService();;
    // The location of Uluru
    var lmao = { lat: map_default_loc[0], lng:  map_default_loc[1] };
    // The map, centered at Uluru
    map = new google.maps.Map(document.getElementById("map"), {
      mapId: mapid,
      zoom: 1,
      center: lmao,
      streetViewControl: false
    });
    
    /*var markers = new Array();
    var new_marker = new google.maps.Marker({
      position: {"lat": loc[0], "lng": loc[1]},
      map: map,
      title: "hi test"
    });
    markers.push(new_marker);*/

    map.addListener("click", (mapsMouseEvent) => {
      if ( allow_suggest == true) {
        for (let i = 0; i < suggestion_markers.length; i++) {
          suggestion_markers[i].setMap(null);
        }
        suggestion_markers = [];
        
        suggestion_loc = mapsMouseEvent.latLng.toJSON();
  
        var suggestion_marker = new google.maps.Marker({
          position: suggestion_loc,
          map: map,
          title: "your suggestion",
          icon: {
            url: "assets/blue_pin.svg"
          }
        });
        suggestion_markers.push(suggestion_marker)
  
        document.querySelector(".suggest-button").classList.remove("disabled");
      }
    });

    reflection_map = new google.maps.Map(document.getElementById("reflection-map"), {
      mapId: mapid,
      zoom: 1,
      center: lmao,
      streetViewControl: false
    });

  } catch (err) {
    if (err.message != "google is not defined") {   // i KNOW
        console.error(err)
    }
  } 
}

// [50.448461, -38.474407]
// [47.620198917035076, -122.34887843445061]
//initMap([47.620198917035076, -122.34887843445061]);




function get_random_coord(category, do_after) {

  var max_loc = [-90, -180];
  var min_loc = [90, 180];

  for (i in categories[category]["bounds"]) {

    for (e in categories[category]["bounds"][i]) {
      var bound = categories[category]["bounds"][i][e];
      if (bound["lat"] > max_loc[0]) {
        max_loc[0] = bound["lat"];
      } else if (bound["lat"] < min_loc[0]) {
        min_loc[0] = bound["lat"];
      }
      if (bound["lng"] > max_loc[1]) {
        max_loc[1] = bound["lng"];
      } else if (bound["lng"] < min_loc[1]) {
        min_loc[1] = bound["lng"];
      }
    }

  }

  bounds_stuff = {"min": min_loc, "max": max_loc};

  console.log("bounds:", min_loc, max_loc);

  find_pano_interval = false;
  find_coords_interval = false;
  found_coords = false;
  found_loc = false;

  find_coords_interval = setInterval( () => {
    var random_loc;
    var loc_data;

    if (found_loc == true) {
      console.log("FOUND LOC TRUE !!! FROM FIND COORDS");
      clearInterval(find_pano_interval);
      clearInterval(find_coords_interval);
    }

    if (found_loc == false) {
      
      if (found_coords == false) {
        tried_locations += 1;
        document.querySelector(".location-count").innerHTML = `${tried_locations.toFixed(1)}`;
        random_loc = [((Math.random() * (max_loc[0] - min_loc[0]) ) + min_loc[0]), ((Math.random() * (max_loc[1] - min_loc[1]) ) + min_loc[1])];
        loc_data = {"lat": random_loc[0], "lng": random_loc[1]};
        console.log("random loc:", random_loc);

        // see if its in bounds
        for (w in categories[category_playing]["bounds"]) {
          var point_check_tm = ray_casting({"lat": random_loc[0], "lng": random_loc[1]}, categories[category_playing]["bounds"][w]);
          console.log("RAY CHECK!!!!", point_check_tm);
          if (point_check_tm == true) {

            if (category_playing == 1) { // USA

              tried_locations += 0.1;
              document.querySelector(".location-count").innerHTML = `${tried_locations.toFixed(1)}`;
              get_geocoding(loc_data["lat"], loc_data["lng"], (results) => {
                console.log(results);
                results_true = false;
                for (s in results) { var hehe = `${results[s]}`; console.log(hehe);
                  if (hehe.includes("USA") || hehe.includes("United States")) {
                    results_true = true;
                  }
                } if (results_true == true) { found_coords = true; real_loc = loc_data; }
              });
    
            } else if (category_playing == 2) { // seattle

              tried_locations += 0.1;
              document.querySelector(".location-count").innerHTML = `${tried_locations.toFixed(1)}`;
              get_geocoding(loc_data["lat"], loc_data["lng"], (results) => {
                console.log(results);
                results_true = false;
                for (s in results) { var hehe = `${results[s]}`; console.log(hehe)
                  if (hehe.includes("Seattle")) {
                    results_true = true;
                  } 
                } if (results_true == true) { found_coords = true; real_loc = loc_data; }
              });

            } else {
              found_coords = true;
              real_loc = loc_data;
            }
            
          }
        }

      } else {

        if (find_pano_interval == false){
          find_pano_interval = setInterval( () => {
            tried_locations += 0.1;
            document.querySelector(".location-count").innerHTML = `${tried_locations.toFixed(1)}`;
  
            console.log(real_loc);
  
            if (found_loc == true) {
              console.log("FOUND LOC TRUE !!! FROM FIND PANO");
              clearInterval(find_pano_interval);
              clearInterval(find_coords_interval);
            }
  
            sv.getPanoramaByLocation(real_loc, 10000, (data, status) => {
              if (status == google.maps.StreetViewStatus.OK) {
                clearInterval(find_pano_interval);
                console.log("GOOD!!");
      
                real_loc = data.location.latLng.toJSON();
                real_loc = [real_loc["lat"], real_loc["lng"]]
                console.log("REAL LOC!!", real_loc);
      
                document.querySelector(".chili-wrapper").style.display = "none";
                document.querySelector(".suggestion").style.display = "";
  
                found_loc = true;
                clearInterval(find_pano_interval);
                clearInterval(find_coords_interval);
                do_after();
              } else {
                console.log("NOT GOOD!!");
                found_coords = false;
              }
            });
      
          }, 500);
        }
        
      }
    } else {
      clearInterval(find_pano_interval);
      clearInterval(find_coords_interval);
    }
  }, 100);
    
}



function play_category(category_in) {

  category_playing = category_in;
  console.log(category_in)

  document.querySelector(".title-page").style.display = "none";
  document.querySelector(".end-page").style.display = "none";
  document.querySelector(".reflection-page").style.display = "none";
  
  new_scene();

}

function new_scene() { // new scene

  suggestion_loc = false;
  tried_locations = 0;
  fancy_time_seconds = 0;
  clearInterval(fancy_time_interval);
  fancy_time(0);
  real_loc;
  document.querySelector(".chili-wrapper").style.display = "";
  document.querySelector(".suggestion").style.display = "none";
  document.querySelector(".title-page").style.display = "none";
  document.querySelector(".end-page").style.display = "none";
  document.querySelector(".reflection-page").style.display = "none";

  get_random_coord(category_playing, () => {
    clearInterval(find_pano_interval);
    clearInterval(find_coords_interval);
    do_street_view(real_loc);
    moveToLocation(categories[category_playing]["center"][0], categories[category_playing]["center"][1], categories[category_playing]["zoom"]);
  })
  allow_suggest = true;
  resize_map(false);
  document.querySelector(".suggest-button").classList.add("disabled");

  for (let i = 0; i < suggestion_markers.length; i++) {
    suggestion_markers[i].setMap(null);
  }
  suggestion_markers = [];
  time_start = new Date();

  fancy_time_interval = setInterval( () => {
    fancy_time_seconds += 1;
    fancy_time(fancy_time_seconds);
  }, 1000);

}

function resize_map(big) {
  // if (allow_suggest == true) {
  if (document.querySelector("#map").classList.contains("large") && big != true || big == false) {
    document.querySelector("#map").classList.remove("large");
    document.querySelector(".resize-button").innerHTML = `>`;
  } else {
    document.querySelector("#map").classList.add("large");
    document.querySelector(".resize-button").innerHTML = `<`;
  }
  // }
}

function moveToLocation(lat, lng, zoom){
  var center = new google.maps.LatLng(lat, lng);
  map.panTo(center);
  if (zoom == undefined) {
    zoom = 1;
  }
  map.setZoom(zoom)
}

function make_suggestion() {

  if (document.querySelector(".suggest-button").classList.contains("disabled") == false) {
    // submit suggestion
    resize_map(true);
    allow_suggest = false;
    clearInterval(fancy_time_interval);
    document.querySelector(".suggest-button").classList.add("disabled");
    document.querySelector(".end-page").style.display = "";

    var suggestion_marker = new google.maps.Marker({
      position: {"lat": real_loc[0], "lng": real_loc[1]},
      map: map,
      title: "real location",
      icon: {
        url: "assets/red_pin.svg"
      }
    });
    suggestion_markers.push(suggestion_marker)

    var distance_miles = haversine_distance(suggestion_loc, {"lat": real_loc[0], "lng": real_loc[1]})

    var distance;

    if (miles == false) {
      distance = distance_miles * 1.60934;
    } else {
      distance = distance_miles;
    }

    if (distance >= 1000) {
      distance = parseInt(distance);
    } else if (distance >= 100) {
      distance = distance.toFixed(1);
    } else if (distance >= 1) {
      distance = distance.toFixed(2);
    } else if (distance == 1) {
      distance = parseInt(distance);
    } else {
      distance = distance.toFixed(3);
    }

    var distance_text;

    if (miles == true) {
      distance_text = `${distance} mi`;
      
    } else {
      distance_text = `${distance} km`;
    }

    document.querySelector(".distance").innerHTML = distance_text

    var path_tm = [
      { lat: suggestion_loc["lat"], lng: suggestion_loc["lng"] },
      { lat: real_loc[0], lng: real_loc[1] },
    ];
    var yummy_path = new google.maps.Polyline({
      path: path_tm,
      map: map,
      geodesic: true,
      strokeColor: "#fbbc04",
      strokeOpacity: 1.0,
      strokeWeight: 5,
    });

    suggestion_markers.push(yummy_path);

    time_end = new Date();

    var gamesave_json = {
      "suggestion": [suggestion_loc["lat"], suggestion_loc["lng"]],
      "real location": [real_loc[0], real_loc[1]],
      "distance": distance_text,
      "start time": time_start.getTime(),
      "end time": time_end.getTime()
    }
    gamesave_save.push(gamesave_json);
  }
}

function toggle_button(id) {
  var enabledja = document.querySelector(`.toggle[ja_id="${id}"]`).classList.contains("enabled");
  if (enabledja == false) {
    document.querySelector(`.toggle[ja_id="${id}"]`).classList.add("enabled");
    if (id == 0) {
      miles = true;
    }
  } else {
    document.querySelector(`.toggle[ja_id="${id}"]`).classList.remove("enabled");
    if (id == 0) {
      miles = false;
    }
  }
}

function doublefy(num) {
  var out = `${parseInt(num)}`;
  if (parseInt(num) < 10) {
    out = `0${parseInt(num)}`;
  }
  return out
}

function funny_time(ms_elapsed) {
  s_elapsed = parseInt(ms_elapsed/1000);
  h = parseInt(s_elapsed / 3600);
  s_elapsed = s_elapsed - ( h * 3600 );
  m = parseInt(s_elapsed / 60);
  s_elapsed = s_elapsed - (m * 60);
  s = s_elapsed;

  var string_out = "";

  if (h != 0) {
    string_out += `${doublefy(h)}:`;
  }
  string_out += `${doublefy(m)}:${doublefy(s)}`;

  return string_out
}


function end_game() {
  document.querySelector(".reflection-page").style.display = "";
  document.querySelector(".reflections").innerHTML = "";
  for (i in gamesave_save) {
    var node_tmtm = document.createElement("h3");
    var time_tmtm = parseInt(gamesave_save[i]["end time"]) - parseInt(gamesave_save[i]["start time"]);
    node_tmtm.innerHTML = `${i}<br>${gamesave_save[i]["real location"]}<br>${gamesave_save[i]["distance"]}<br>${funny_time(time_tmtm)}`;
    document.querySelector(".reflections").appendChild(node_tmtm);

    var reflection_marker = new google.maps.Marker({
      position: {"lat": gamesave_save[i]["suggestion"][0], "lng": gamesave_save[i]["suggestion"][1]},
      map: reflection_map,
      title: `[${i}] your suggestion`,
      icon: {
        url: "assets/blue_pin.svg"
      }
    });
    reflection_markers.push(reflection_marker);
    var reflection_marker = new google.maps.Marker({
      position: {"lat": gamesave_save[i]["real location"][0], "lng": gamesave_save[i]["real location"][1]},
      map: reflection_map,
      title: `[${i}] real location`,
      icon: {
        url: "assets/red_pin.svg"
      }
    });
    reflection_markers.push(reflection_marker);

    var path_tm = [{"lat": gamesave_save[i]["suggestion"][0], "lng": gamesave_save[i]["suggestion"][1]},{"lat": gamesave_save[i]["real location"][0], "lng": gamesave_save[i]["real location"][1]}];
    var yummy_path = new google.maps.Polyline({
      path: path_tm,
      map: reflection_map,
      geodesic: true,
      strokeColor: "#fbbc04",
      strokeOpacity: 1.0,
      strokeWeight: 5,
    });

    reflection_markers.push(yummy_path);

    reflection_map.addListener("click", (mapsMouseEvent) => {
      if ( polygon_maker == true) {
    
        point_loc = mapsMouseEvent.latLng.toJSON();
  
        console.log(point_loc);
        polygon_points.push(point_loc);
        var real_polygon_points = [];

        for (i in polygon_points) {
          if (polygon_points[i]["lat"]) {
            real_polygon_points.push(polygon_points[i]);
          }
        }

        if (map_polygon != false) {
          map_polygon.setMap(null);
        }

        map_polygon = new google.maps.Polygon({
          paths: real_polygon_points,
          strokeColor: "#FF0000",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#FF0000",
          fillOpacity: 0.35,
          map: reflection_map
        });


        var point_marker = new google.maps.Marker({
          position: point_loc,
          map: reflection_map,
          title: "point",
          icon: {
            url: "assets/blue_pin.svg"
          }
        });
        eval(`point_marker.addListener('click',()=> { remove_point_marker(${polygon_markers.length})});`);
        
        polygon_markers.push(point_marker);
  
        document.querySelector(".suggest-button").classList.remove("disabled");
      }
    });

  }

}

function remove_point_marker(id) {
  polygon_markers[id].setMap(null);
  polygon_points[id] = false;

  var real_polygon_points = [];
  for (i in polygon_points) {
    if (polygon_points[i]["lat"]) {
      real_polygon_points.push(polygon_points[i]);
    }
  }

  if (map_polygon != false) {
    map_polygon.setMap(null);
  }

  map_polygon = new google.maps.Polygon({
    paths: real_polygon_points,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
    map: reflection_map
  });
}

function enable_polygon_maker() {
  polygon_maker = true;
  polygon_points = [];
  map_polygon = false;

  for (let i = 0; i < reflection_markers.length; i++) {
    reflection_markers[i].setMap(null);
  }
  reflection_markers = [];
  var node_tmtm = document.createElement("h2");
  node_tmtm.classList.add("button");
  node_tmtm.classList.add("basic");
  node_tmtm.classList.add("rpm");
  node_tmtm.setAttribute("onclick", `reset_polygon_maker()`);
  node_tmtm.innerHTML = "reset polygon maker";
  document.querySelector(".reflection-page").appendChild(node_tmtm);
  var node_tmtm = document.createElement("h2");
  node_tmtm.classList.add("button");
  node_tmtm.classList.add("basic");
  node_tmtm.classList.add("cpj");
  node_tmtm.setAttribute("onclick", `copy_polygon_json()`);
  node_tmtm.innerHTML = "copy polygon json";
  document.querySelector(".reflection-page").appendChild(node_tmtm);
  var node_tmtm = document.createElement("h2");
  node_tmtm.classList.add("button");
  node_tmtm.classList.add("basic");
  node_tmtm.classList.add("dpm");
  node_tmtm.setAttribute("onclick", `disable_polygon_maker()`);
  node_tmtm.innerHTML = "disable polygon maker";
  document.querySelector(".reflection-page").appendChild(node_tmtm);
}

function reset_polygon_maker() {
  for (let i = 0; i < polygon_markers.length; i++) {
    polygon_markers[i].setMap(null);
  }
  polygon_markers = [];
  polygon_points = [];
  map_polygon.setMap(null);
  map_polygon = false;
}

function disable_polygon_maker() {
  polygon_maker = false;
  document.querySelector(".button.rpm").remove();
  document.querySelector(".button.cpj").remove();
  document.querySelector(".button.dpm").remove();
}

function copy_polygon_json() {
  var real_polygon_points = [];
  for (i in polygon_points) {
    if (polygon_points[i]["lat"]) {
      real_polygon_points.push(polygon_points[i]);
    }
  }
  var polygon_json = JSON.stringify(real_polygon_points);
  navigator.clipboard.writeText(polygon_json);
}

function go_home() {
  document.querySelector(".end-page").style.display = "none";
  document.querySelector(".reflection-page").style.display = "none";
  document.querySelector(".title-page").style.display = "";
}

function get_geocoding(lat, lng, do_after) {
  var geocoder = new google.maps.Geocoder();
  var loc = new google.maps.LatLng(lat, lng);
  var address_list_out = [];

  geocoder.geocode( { 'location': loc}, function(results, status) {
    if (status == 'OK') {
      console.log(results);
      for (i in results) {
        address_list_out.push(results[i]["formatted_address"]);
      }
      do_after(address_list_out);

    } else {
      console.error('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function reset_pano() {
  // do_street_view(real_loc);
  panorama.setPosition(new google.maps.LatLng(real_loc[0], real_loc[1]));
}


function do_num(num1, num2, elm) {
  if (num1 != num2) {
      document.getElementById(`${elm}`).style.transitionDuration = "500ms";
      document.getElementById(`${elm}_1`).innerHTML = `${num1}`;
      document.getElementById(`${elm}_2`).innerHTML = `${num2}`;
      document.getElementById(`${elm}`).style.marginTop = "-1.2em";
      setTimeout( () => {
          document.getElementById(`${elm}`).style.transitionDuration = "0ms";
          document.getElementById(`${elm}`).style.marginTop = "0px";
          document.getElementById(`${elm}_2`).innerHTML = `${num1}`;
          document.getElementById(`${elm}_1`).innerHTML = `${num2}`;
      }, 500);
  }
}

function doublefy(num) {
  if (`${num}`.length == 1) {
      num = `0${num}`;
  } else {
      num = `${num}`;
  }
  return num
}
function tripledecify(num) {
  var out;
  var tm = `${num}`.split(".");
  if (tm.length == 1) {
      out = `${num}.000`;
  } else {
      if (tm[1].length == 1) {
          out = `${num}00`;
      } else if (tm[1].length == 2) {
          out = `${num}0`;
      } else {
          out = `${num}`;
      }
  }
  return out
}

function fancy_time(seconds) {
  var floor_seconds = Math.floor(seconds);
  fancy_hours = Math.floor(floor_seconds / 3600);
  fancy_minutes = Math.floor( ( floor_seconds - (fancy_hours * 3600) ) / 60 );
  fancy_seconds = floor_seconds - (fancy_hours * 3600) - (fancy_minutes * 60);

  // console.log(fancy_hours)
  // console.log(fancy_minutes)
  // console.log(fancy_seconds)
  
  if (fancy_hours > 0) {
      hours_checked = true;
      hours_exist = true;
  }
  if (hours_exist == true) {
      var split_hours = doublefy(fancy_hours).split("");
      var split_prev_hours = doublefy(prev_fancy_hours).split("");
      do_num(split_prev_hours[0], split_hours[0], "h1");
      do_num(split_prev_hours[1], split_hours[1], "h2");
  }
  var split_minutes = doublefy(fancy_minutes).split("");
  var split_prev_minutes = doublefy(prev_fancy_minutes).split("");
  do_num(split_prev_minutes[0], split_minutes[0], "m1");
  do_num(split_prev_minutes[1], split_minutes[1], "m2");
  var split_seconds = doublefy(fancy_seconds).split("");
  var split_prev_seconds = doublefy(prev_fancy_seconds).split("");
  do_num(split_prev_seconds[0], split_seconds[0], "s1");
  do_num(split_prev_seconds[1], split_seconds[1], "s2");

  prev_fancy_hours = fancy_hours;
  prev_fancy_minutes = fancy_minutes;
  prev_fancy_seconds = fancy_seconds;
}