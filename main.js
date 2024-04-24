// lat and lng bounds:
// lat: -90, 90
// lng: -180, 180

var categories = [
  {
    "name": "world",
    "img": "assets/earth.jpg",
    "bounds": [
      [-90, -180],
      [90, -180],
      [90, 180],
      [-90, 180]
    ]
  },
  {
    "name": "usa",
    "img": "assets/centralpark.jpg",
    "bounds": [
      [-90, -180],
      [90, -180],
      [90, 180],
      [-90, 180]
    ]
  },
]

var map;
var mapid = "9bd2e77c7cbe837c";
var map_default_loc = [0, 0];
var category_playing;
var suggestion_loc = false;
var suggestion_markers = [];
var sv;
var find_coords_interval;
var real_loc;
var allow_suggest = false;
var gamesave_save = [];
var miles = true;
var time_start;


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
  x = point[0],
  y = point[1],
  x1, x2, y1, y2;

  for(var i=0; i < n-1; ++i){
    x1=polygon[i][0];
    x2=polygon[i+1][0];
    y1=polygon[i][1];
    y2=polygon[i+1][1];

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

  const panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano"), {
      position: coordinates_tm,
      pov: {
        heading: 34,
        pitch: 10,
      },
    }
  );

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

  for (e in categories[category]["bounds"]) {
    var bound = categories[category]["bounds"][e];
    if (bound[0] > max_loc[0]) {
      max_loc[0] = bound[0];
    } else if (bound[0] < min_loc[0]) {
      min_loc[0] = bound[0];
    }
    if (bound[1] > max_loc[1]) {
      max_loc[1] = bound[1];
    } else if (bound[1] < min_loc[1]) {
      min_loc[1] = bound[1];
    }
  }

  console.log("bounds:", min_loc, max_loc);

  find_coords_interval = setInterval( () => {

    var random_loc = [((Math.random() * (max_loc[0] - min_loc[0]) ) + min_loc[0]), ((Math.random() * (max_loc[1] - min_loc[1]) ) + min_loc[1])];
    var loc_data = {"lat": random_loc[0], "lng": random_loc[1]};
    console.log("random loc:", random_loc);

    sv.getPanoramaByLocation(loc_data, 10000, (data, status) => {
      if (status == google.maps.StreetViewStatus.OK) {
        clearInterval(find_coords_interval);
        console.log("GOOD!!");

        real_loc = data.location.latLng.toJSON();
        real_loc = [real_loc["lat"], real_loc["lng"]]
        console.log("REAL LOC!!", real_loc);

        document.querySelector(".chili-wrapper").style.display = "none";
        do_after();
      } else {
        console.log("NOT GOOD!!");
      }
    });

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
  real_loc;
  document.querySelector(".chili-wrapper").style.display = "";
  document.querySelector(".title-page").style.display = "none";
  document.querySelector(".end-page").style.display = "none";
  document.querySelector(".reflection-page").style.display = "none";

  get_random_coord(category_playing, () => {
    do_street_view(real_loc);
    moveToLocation(0, 0);
  })
  allow_suggest = true;
  resize_map(false);
  document.querySelector(".suggest-button").classList.add("disabled");

  for (let i = 0; i < suggestion_markers.length; i++) {
    suggestion_markers[i].setMap(null);
  }
  suggestion_markers = [];
  time_start = new Date();

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

function moveToLocation(lat, lng){
  var center = new google.maps.LatLng(lat, lng);
  map.panTo(center);
  map.setZoom(1)
}

function make_suggestion() {

  if (document.querySelector(".suggest-button").classList.contains("disabled") == false) {
    // submit suggestion
    resize_map(true);
    allow_suggest = false;
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
  for (i in gamesave_save) {
    var node_tmtm = document.createElement("h3");
    var time_tmtm = parseInt(gamesave_save[i]["end time"]) - parseInt(gamesave_save[i]["start time"]);
    node_tmtm.innerHTML = `${i}<br>${gamesave_save[i]["real location"]}<br>${gamesave_save[i]["distance"]}<br>${funny_time(time_tmtm)}`;
    document.querySelector(".reflections").appendChild(node_tmtm);
  }

}