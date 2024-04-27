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
var kilometers = false;
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
var panorama;
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
var localstorage_object = {"hello": "yes"};
var true_random = true;
var nearby_city_radius = 100;
var api_city_data = {};
var places_api;
var enable_cheat_markers = false;
var the_funny = {};
var geocoder;
var coords_interval_done = true;
var dev_loc = {
  "lat": false,
  "lng": false
};


// LOCALSTORAGE
try {
  var from_ls = JSON.parse(localStorage.getItem("locationsuggestr"));
  if (typeof from_ls == typeof {}) {
    if (from_ls["hello"]) {
      localstorage_object = JSON.parse(JSON.stringify(from_ls));
    }
  }
} catch (err){
  console.error(err);
}

if (localstorage_object["gamesave"] != undefined) {
  gamesave_save = localstorage_object["gamesave"];
}
if (localstorage_object["kilometers"] != undefined) {
  kilometers = localstorage_object["kilometers"];
}
if (localstorage_object["true random"] != undefined) {
  true_random = localstorage_object["true random"];
}

function save_localstorage() {
  localstorage_object["gamesave"] = gamesave_save;
  localstorage_object["kilometers"] = kilometers;
  localstorage_object["true random"] = true_random;
  
  localStorage.setItem("locationsuggestr", JSON.stringify(localstorage_object));
}

function clear_history() {
  gamesave_save = [];
  save_localstorage();
  for (let i = 0; i < reflection_markers.length; i++) {
    reflection_markers[i].setMap(null);
  }
  reflection_markers = [];
  document.querySelector(".reflections").innerHTML = "";
}

// toggle buttons auto
if (kilometers == true) {
  document.querySelector(`.toggle[ja_id="0"]`).classList.add("enabled");
}
if (true_random == true) {
  document.querySelector(`.toggle[ja_id="1"]`).classList.add("enabled");
}

function copy_json(input) {
  return JSON.parse(JSON.stringify(input));
}


function funny_marker(label, marker_loc, colour) {
  var suggestion_marker = new google.maps.Marker({
    position: marker_loc,
    map: map,
    title: `${label}`,
    icon: {
      url: `assets/${colour}_pin.svg`
    }
  });
  suggestion_markers.push(suggestion_marker)
}

function calculate_distance(p1, p2) {
  const dx = p2["lat"] - p1["lat"];
  const dy = p2["lng"] - p1["lng"];
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance;
}

function area_sqft(p1, p2) {
  var lat1 = p1["lat"];
  var lat2 = p2["lat"];
  var lon1 = p1["lng"];
  var lon2 = p2["lng"];

  const R = 3959; // Earth's radius in miles
  const toRad = Math.PI / 180;

  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in miles

  const areaInSquareMiles = distance * distance;
  const areaInSquareFeet = areaInSquareMiles * 27878400; // 1 square mile = 27,878,400 square feet

  return areaInSquareFeet;
}


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
    sv = new google.maps.StreetViewService();
    // The location of Uluru
    var lmao = { lat: map_default_loc[0], lng:  map_default_loc[1] };
    // The map, centered at Uluru
    map = new google.maps.Map(document.getElementById("map"), {
      mapId: mapid,
      zoom: 1,
      center: lmao,
      streetViewControl: false
    });

    geocoder = new google.maps.Geocoder();
    places_api = new google.maps.places.PlacesService(map);   // places api
    
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


function add_tried_loc(num) {
  tried_locations += num;
  document.querySelector(".location-count").innerHTML = `${tried_locations.toFixed(2)}`;
}

function get_random_coord(category, do_after) {

  its_all_good = false;

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
  coords_interval_done = true;

  find_coords_interval = setInterval( () => {

    if (coords_interval_done == true) {
      coords_interval_done = false;

      var random_loc;
      var loc_data;
  
      if (found_loc == true) {
        console.log("FOUND LOC TRUE !!! FROM FIND COORDS");
        clearInterval(find_pano_interval);
        clearInterval(find_coords_interval);
      }
  
      if (found_loc == false) {
        
        if (found_coords == false) {
          add_tried_loc(1);
          random_loc = [((Math.random() * (max_loc[0] - min_loc[0]) ) + min_loc[0]), ((Math.random() * (max_loc[1] - min_loc[1]) ) + min_loc[1])];
          if (dev_loc["lat"] != false && dev_loc["lng"] != false) {
            random_loc = [dev_loc["lat"], dev_loc["lng"]];
          }
          loc_data = {"lat": random_loc[0], "lng": random_loc[1]};
          console.log("random loc:", random_loc);
  
          // see if its in bounds
          for (w in categories[category_playing]["bounds"]) {
            var point_check_tm = ray_casting(loc_data, categories[category_playing]["bounds"][w]);
            console.log("RAY CHECK!!!!", point_check_tm);
            if (point_check_tm == true) {
  
              if (category_playing == 1) { // USA
                
                get_geocoding(loc_data["lat"], loc_data["lng"], (results) => {
                  add_tried_loc(0.01);
                  console.log(results);
                  results_true = false;
                  for (s in results) {
                    var hehe = `${results[s]}`;
                    console.log(hehe);
                    if (hehe.includes("USA") || hehe.includes("United States")) {
                      results_true = true;
                    }
                  } if (results_true == true) {
                    coords_interval_done = true;
                    found_coords = true;
                    real_loc = loc_data;
                  }
                });
      
              } else if (category_playing == 2) { // seattle
                
                get_geocoding(loc_data["lat"], loc_data["lng"], (results) => {
                  add_tried_loc(0.01);
                  console.log(results);
                  results_true = false;
                  for (s in results) {
                    var hehe = `${results[s]}`;
                    console.log(hehe)
                    if (hehe.includes("Seattle")) {
                      results_true = true;
                    } 
                  } if (results_true == true) {
                    coords_interval_done = true;
                    found_coords = true;
                    real_loc = loc_data;
                  }
                });
              } else {
                found_coords = true;
                real_loc = loc_data;
                coords_interval_done = true;
              }
            } else {
              coords_interval_done = true;
            }
          }
  
        } else {
          console.log(real_loc);
  
          if (enable_cheat_markers == true) {
            for (let i = 0; i < suggestion_markers.length; i++) {
              suggestion_markers[i].setMap(null);
            }
            suggestion_markers = [];
            var suggestion_marker = new google.maps.Marker({
              position: real_loc,
              map: map,
              title: "real location",
              icon: {
                url: "assets/red_pin.svg"
              }
            });
            suggestion_markers.push(suggestion_marker)
            }

            // DO THE REST!!!!
            // DO THE REST!!!!
  
            the_funny["do the rest"] = () => {
              if (find_pano_interval == false){
                find_pano_interval = setInterval( () => {
                  
                  if (found_loc == true) {
                    console.log("FOUND LOC TRUE !!! FROM FIND PANO");
                    clearInterval(find_pano_interval);
                    clearInterval(find_coords_interval);
                  }
        
                  sv.getPanoramaByLocation(real_loc, 10000, (data, status) => {
                    add_tried_loc(0.01);
                    if (status == google.maps.StreetViewStatus.OK) {
                      console.log(status);
                      clearInterval(find_pano_interval);
                      console.log("GOOD!!");
            
                      real_loc = data.location.latLng.toJSON();
                      real_loc = [real_loc["lat"], real_loc["lng"]];
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
                      coords_interval_done = true;
                    }
                  });
  
                }, 500);
              }
            }

            
  
  
          if (true_random == false && categories[category_playing]["true random"] != false) {   // TRUE RANDOM IS DISABLED, MAKE IT WEIGHTED N STUFF!!
  
            // NEARBY CITIES
            // https://stackoverflow.com/questions/7202272/using-the-google-places-api-to-get-nearby-cities-for-a-given-place
            
            // POPULATION OF CITY
            // https://www.wikidata.org/wiki/Property:P1082
            // NOT FREE: https://api-ninjas.com/api/city
            // https://publicapis.io/population-io-api
            // this one may be it ?? : https://www.census.gov/data/developers/data-sets/popest-popproj/popest.html
  
            // ended up using wikidata! yippee!!
  
            // FOR SEARCH PARAMETERS:
            // if it is in the USA, do CITY and STATE.
            // for outside the US, do CITY and COUNTRY.
            // if there are errors, uh, L. get good.
            // gonna have to implement a failsafe that will fall back to the original random location if there's an error
  
            towns_loc_close = [];
            towns_close = [];
            towns_loc_close.push(real_loc);
  
            var request = {
              location: real_loc,
              radius: '50000',
              type: ['locality']
            };
  
            places_api.nearbySearch(request, (results, status) => {
              add_tried_loc(0.01);
              if (status === google.maps.places.PlacesServiceStatus.OK) {
                
                for (let i = 0; i < results.length; i++) {
                  console.log(typeof results, results)
                  var place = results[i];
                  console.log("PLACE !!!!", i, place);
                  if (place["geometry"]) {
                    if (place["geometry"]["location"] || place["geometry"]["viewport"]) {
                      var use_location = false;
                      var use_viewport = false;
                      if (place["geometry"]["location"]["lat"] && place["geometry"]["location"]["lng"]) {
                        if (typeof place["geometry"]["location"]["lat"] == typeof 0 && place["geometry"]["location"]["lng"] == typeof 0) {
                          use_location = true;
                        }
                      }
                      if (place["geometry"]["viewport"]["Gh"] && place["geometry"]["viewport"]["Vh"]) {
                        if (place["geometry"]["viewport"]["Gh"]["hi"] && place["geometry"]["viewport"]["Vh"]["hi"]) {
                          if (typeof place["geometry"]["viewport"]["Gh"]["hi"] == typeof 0 && typeof place["geometry"]["viewport"]["Vh"]["hi"] == typeof 0) {
                            use_viewport = true;
                          }
                        }
                      }
                      if (use_location == true) {
                        towns_loc_close.push({
                          "lat": place["geometry"]["location"]["lat"],
                          "lng": place["geometry"]["location"]["lng"]
                        });
                      } else if (use_viewport == true) {
                        towns_loc_close.push({
                          "lat": place["geometry"]["viewport"]["Vh"]["hi"],
                          "lng": place["geometry"]["viewport"]["Gh"]["hi"]
                        });
                      } else {
                        // do NOTHING!!
                      }
                    }
                  }
                }  
                console.log("ALL TOWNS!!!", towns_loc_close);
                for (w in towns_loc_close) {
                  console.log("TOWN ??", w, towns_loc_close[w]);
                  get_geocody_lmao(towns_loc_close[w], () => {
                    console.log("THIS IS WHAT IM DOING AFTERWARDS!!!");
                    console.log("TOWNS CLOSE!!!!", copy_json(towns_close));
                    var city_math = {};
                    for (we in towns_close) {
                      var city_name = towns_close[we]["city"];
                      city_math[city_name] = {};
                      city_math[city_name]["distance"] = calculate_distance(towns_close[0]["loc"], towns_close[we]["loc"]);
                      city_math[city_name]["loc"] = towns_close[we]["loc"];
                      city_math[city_name]["area"] = area_sqft(
                        {
                          "lat": towns_close[we]["bounds"]["north"],
                          "lng": towns_close[we]["bounds"]["west"]
                        },
                        {
                          "lat": towns_close[we]["bounds"]["south"],
                          "lng": towns_close[we]["bounds"]["east"]
                        }
                      ).toFixed(3);
                      if (enable_cheat_markers == true) {
                        funny_marker(`${city_name}`, towns_loc_close[w], "green");
                      }
                      console.log("CITY MATH RESULT:", city_name, city_math[city_name]["distance"]);
                    }
                    for (la in city_math) {
                      if (city_math[la]["distance"] == 0) {
                        //delete city_math[la];
                      }
                    }
                    console.log("CITY MATH!!!!", city_math);
                    // ACTRUAL MATHHHHHHH

                    var cmn = [];
                    for (woo in city_math) {
                      cmn.push(woo);
                    }

                    if (city_math.length >= 2) {
                      var size_factor = (city_math[cmn[0]]["area"] / city_math[cmn[1]]["area"]) * 1.0;
                      
                      if (size_factor < 1) {
                        var lat_og = city_math[cmn[0]]["loc"]["lat"];
                        var lng_og = city_math[cmn[0]]["loc"]["lng"];
                        var lat_mg = city_math[cmn[1]]["loc"]["lat"];
                        var lng_mg = city_math[cmn[1]]["loc"]["lng"];
                        var lat_ch = lat_og + ( (lat_mg - lat_og) - ( (lat_mg - lat_og) * size_factor) );
                        var lng_ch = lng_og + ( (lng_mg - lng_og) - ( (lng_mg - lng_og) * size_factor) );
                        
                        real_loc = {
                          "lat": lat_ch,
                          "lng": lng_ch

                        }
                        if (enable_cheat_markers == true) {
                          funny_marker(`changed location`, real_loc, "green");
                        }

                      }
                      
                    }


                    its_all_good = true;
                  });
                  //its_all_good = true;
                }
              }
            });
  
  
            function get_geocody_lmao(loc, do_after) {
                
              geocoder.geocode( { 'location': loc}, function(results, status) {
                if (status == 'OK') {
                  console.log("ADDY!!!!", results);
  
                  if (results[1]) {
                    // woah! it has results! wow!
                    if (results[1]["address_components"] && results[0]["geometry"]) {
                      // WOW!!! IT EXISTS MORE!!
                      var thingymabob = {};
  
                      for (o in results[1]["address_components"]) {
                        thingymabob[`${results[1]["address_components"][o]["types"][0]}`] = results[1]["address_components"][o]["long_name"]
                      }
                      console.log("THINGYMABOB!!!!", thingymabob)
                      if (thingymabob["country"] && thingymabob["locality"] && thingymabob["administrative_area_level_1"] && results[0]["geometry"]["bounds"] && results[0]["geometry"]["location"]) {
                        // it has the three elements of harmony
                        
                        var use_bounds = false;
                        var use_viewport = false;
  

                        if (typeof results[0]["geometry"]["bounds"]["Gh"] == typeof {} && typeof results[0]["geometry"]["bounds"]["Vh"] == typeof {} ) {
                          if (typeof results[0]["geometry"]["bounds"]["Gh"]["hi"] == typeof 1.5 && typeof results[0]["geometry"]["bounds"]["Vh"]["hi"] == typeof 1.5 && typeof results[0]["geometry"]["bounds"]["Gh"]["lo"] == typeof 1.5 && typeof results[0]["geometry"]["bounds"]["Vh"]["lo"] == typeof 1.5) {
                            use_bounds = true
                          }
                        }
                        if (typeof results[0]["geometry"]["viewport"]["Gh"] == typeof {} && typeof results[0]["geometry"]["viewport"]["Vh"] == typeof {} ) {
                          if (typeof results[0]["geometry"]["viewport"]["Gh"]["hi"] == typeof 1.5 && typeof results[0]["geometry"]["viewport"]["Vh"]["hi"] == typeof 1.5 && typeof results[0]["geometry"]["viewport"]["Gh"]["lo"] == typeof 1.5 && typeof results[0]["geometry"]["viewport"]["Vh"]["lo"] == typeof 1.5) {
                            use_viewport = true
                          }
                        }

  
                        var boundy = {};

                        console.log("USE BOUNDS:", use_bounds, "USE VIEWPORT:", use_viewport);
  
                        if (use_bounds == true) {
                          boundy["north"] = results[0]["geometry"]["bounds"]["Gh"]["hi"];
                          boundy["south"] = results[0]["geometry"]["bounds"]["Gh"]["lo"];
                          boundy["west"] = results[0]["geometry"]["bounds"]["Vh"]["hi"];
                          boundy["east"] = results[0]["geometry"]["bounds"]["Vh"]["lo"];
                        } else if (use_viewport == true) {
                          boundy["north"] = results[0]["geometry"]["viewport"]["Gh"]["hi"];
                          boundy["south"] = results[0]["geometry"]["viewport"]["Gh"]["lo"];
                          boundy["west"] = results[0]["geometry"]["viewport"]["Vh"]["hi"];
                          boundy["east"] = results[0]["geometry"]["viewport"]["Vh"]["lo"];
                        }
  
                        var center = {
                          "lat": ( (boundy["west"] - boundy["east"]) / 2 ) + boundy["east"],
                          "lng": ( (boundy["north"] - boundy["south"]) / 2 ) + boundy["south"]
                        }
  
                        if (use_bounds == true || use_viewport == true) {
  
                          towns_close.push({
                            "loc": loc,
                            "country": thingymabob["country"],
                            "city": thingymabob["locality"],
                            "state": thingymabob["administrative_area_level_1"],
                            "bounds": {
                              "north": boundy["north"],
                              "south": boundy["south"],
                              "west": boundy["west"],
                              "east": boundy["east"]
                            },
                            "location": [
                              center["lat"],
                              center["lng"]
                            ]
                          });
                          //console.log(JSON.stringify(loc))
                          //console.log(JSON.stringify(towns_loc_close[towns_loc_close.length - 1]))
                          if (JSON.stringify(loc) == JSON.stringify(towns_loc_close[towns_loc_close.length - 1])) {
                            do_after();   // the LAST ONE!!!
                          }
                        } else {
                          if (JSON.stringify(loc) == JSON.stringify(towns_loc_close[towns_loc_close.length - 1])) {
                            do_after();
                          }
                        }
                      }
                    }
                  }          
                } else {
                  console.error('Geocode was not successful for the following reason: ' + status);
                }
              });
            }
            //its_all_good = false;
  
            
  
            if (its_all_good == true) {
              the_funny["do the rest"]();
            } else if (its_all_good == false) {
              found_coords = false;
              coords_interval_done = true;
            }
  
          } else {
            the_funny["do the rest"]();
          }
          
        }
      } else {
        clearInterval(find_pano_interval);
        clearInterval(find_coords_interval);
      }

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

    if (kilometers == true) {
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

    if (kilometers == true) {
      distance_text = `${distance} km`;
      
    } else {
      distance_text = `${distance} mi`;
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
    save_localstorage();
  }
}

function toggle_button(id) {
  var enabledja = document.querySelector(`.toggle[ja_id="${id}"]`).classList.contains("enabled");
  if (enabledja == false) {
    document.querySelector(`.toggle[ja_id="${id}"]`).classList.add("enabled");      // ENABLING
    if (id == 0) {
      kilometers = true;
    } else if (id == 1) {
      true_random = true;
    }
  } else {
    document.querySelector(`.toggle[ja_id="${id}"]`).classList.remove("enabled");   // DISABLING
    if (id == 0) {
      kilometers = false;
    } else if (id == 1) {
      true_random = false;
    }
  }
  save_localstorage();
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
  save_localstorage();
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
  var loc = new google.maps.LatLng(lat, lng);
  var address_list_out = [];

  geocoder.geocode( { 'location': loc}, function(results, status) {
    if (status == 'OK') {
      console.log("GEOCODING RESULTS!!", results);
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


function get_city_population(city_name, do_after=false) {
  var city_name = city_name.trim()
  var url_city_name = encodeURIComponent(city_name);
  api_city_data[city_name] = {};
  api_city_data[city_name]["final do after"] = do_after;
  call_api(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${url_city_name}&language=en&format=json&callback=api_callback`,
    () => {
      call_api(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${api_city_data[city_name]["id"]}&props=claims&format=json&callback=api_callback`, do_after)
    },
    {"city name": city_name});
}


function call_api(url, do_after=false, extra_data=false) {
  try {
    document.querySelector("#callapi").innerHTML = "";
    //var url = "https://en.wikipedia.org/w/api.php?action=query&format=json&titles=New_York&prop=revisions&rvprop=content&callback=api_callback";
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    document.querySelector("#callapi").appendChild(script);
    // ^ who even knows what this stuff does i just copied it off of stackoverflow and it works so i dont complain
    if (extra_data != false) {        // save do_after in an object so its accessible by api_callback after the api does the funny
      if (extra_data["city name"]) {
        api_city_data[extra_data["city name"]]["do after"] = do_after;
      }
    }
  } catch (err) {
    console.error(err);
    if (extra_data != false) {        // save do_after in an object so its accessible by api_callback after the api does the funny
      if (extra_data["city name"]) {
        api_city_data[extra_data["city name"]]["error"] = err
      }
    }
  }
}

function api_callback(res) {
  //document.getElementById("getw").innerHTML = JSON.stringify(res.query.normalized[0]);
  console.log(res)
  try {
    if (res["searchinfo"]) {
      var city_name = res["searchinfo"]["search"];
      api_city_data[city_name]["id"] = res["search"][0]["id"];
      api_city_data[city_name]["data"] = res["search"][0];
      api_city_data[city_name]["do after"]();
      api_city_data[api_city_data[city_name]["id"]] = city_name;
      // ^ important for population api call because it doesn't have the city name inclided, just the ID
    } else if (res["entities"]) {
      var list_tm = [];
      for (i in res["entities"]) {
        list_tm.push(i);
      }
      var city_id = list_tm[0];
      var population_number = 0;
      var population_claim = res["entities"][city_id]["claims"]["P1082"];
      if (population_claim) {
        population_number = parseInt(population_claim[0]["mainsnak"]["datavalue"]["value"]["amount"]);
      }
      console.log(population_claim);
      console.log("population!", population_number);
      api_city_data[api_city_data[city_id]]["final do after"](population_number);
    }
  } catch (err) {
    console.error(err);
  }
}

function open_info(id) {
  document.querySelector(`#info_box_${id}`).style.display = "";
}
function close_info(id) {
  document.querySelector(`#info_box_${id}`).style.display = "none";
}