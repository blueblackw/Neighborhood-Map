// Create a model for all the data
var locations = [
	{
		name: "Smithsonian National Museum of Natural History",
		location: {
			lat: 38.8912662,
			lng: -77.0260654
		}
	},
	{
		name: "Smithsonian National Air and Space Museum",
		location: {
			lat: 38.8881601,
			lng: -77.0198679
		}
	},
	{
		name: "The White House",
		location: {
			lat: 38.8976763,
			lng: -77.0365298
		}
	},
	{
		name: "Thomas Jefferson Memorial",
		location: {
			lat: 38.8813806,
			lng: -77.0364536
		}
	},
	{
		name: "Lincoln Memorial",
		location: {
			lat: 38.8892686,
			lng: -77.050176
		}
	},
	{
		name: "National Geographic Museum",
		location: {
			lat: 38.9051618,
			lng: -77.0379637
		}
	},
	{
		name: "George Washington University",
		location: {
			lat: 38.8997,
			lng: -77.0486
		}
	},
	{
		name: "National Postal Museum",
		location: {
			lat: 38.8980972,
			lng: -77.00838
		}
	},
	{
		name: "Library of Congress",
		location: {
			lat: 38.888684,
			lng: -77.004998
		}
	},
	{
		name: "Martin Luther King, Jr. Memorial",
		location: {
			lat: 38.8862302,
			lng: -77.0443766
		}
	}
];

// Global variables
var map;
var markers = [];
var infowindow;
var bounds;

// Initialize map
function initMap() {
	// Constructor creates a new map - only center and zoom are required.
	var mapOption = {
		center: {
			lat: 38.8896198,
			lng: -77.0251712
		},
		zoom: 14,
		mapTypeControl: false
	};

	if ($(window).width() <= 768) {
		mapOption.zoom = 13;
	}

	if ($(window).width() <= 1080) {
		mapOption.zoom = 13;
	}

	map = new google.maps.Map(document.getElementById("map"), mapOption);

	infowindow = new google.maps.InfoWindow();

	bounds = new google.maps.LatLngBounds();

	//The following group uses the location array to create an array of markers on initialize.
	for (var i = 0; i < locations.length; i++) {
	// Get the position from the location array.
		pos = new posMarker(locations[i]);
		currMarker = pos.marker;
		currMarker.map = map;

		currMarker.setMap(map);
		bounds.extend(currMarker.position);
	};

	ko.applyBindings(new ViewModel());
}

var posMarker = function(pos) {
	var self = this;

	this.name = pos.name;
	this.position = pos.location;
	this.address = "";
	this.cityAndState = "";

	this.isVisible = ko.observable(true);

	var defaultIcon = makeMarkerIcon('5BFF33');
	var highlightedIcon = makeMarkerIcon('FF4933');

	var clientID = "13AHZEY02L5VY4YN4LTX5N5UXXD4TK3203SYNSPE3I3N3I1H";
	var clientSecret = "ZAPWVW40SOLCUE05GFMXG33NDJHN2PELU31DEID122FW2GGG";
	var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll=' +
	this.position.lat + ',' + this.position.lng + '&client_id=' + clientID +
	'&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.name;

	$.getJSON(foursquareURL).done(function(data) {
			var results = data.response.venues[0];
			self.address = results.location.formattedAddress[0];
			var bracketIdx = self.address.toLowerCase().indexOf('(');
			if (bracketIdx >= 0) {
				self.address = self.address.substring(0, bracketIdx);
			}
			self.cityAndState = results.location.formattedAddress[1];
	}).fail(function() {
		alert("There was an error with the Foursquare API call. Please try again for Foursquare data.");
	});

	this.marker = new google.maps.Marker({
		position: self.position,
		name: self.name,
		map: map,
		icon: defaultIcon,
		visible: false,
		animation: google.maps.Animation.DROP
	});

	// Create an on event to open an infowindow at each marker.
	this.marker.addListener('click', function() {
		populateInfoWindow(this, infowindow, self.address, self.cityAndState);
		map.panTo(this.getPosition());
	});

	// Create an on event to mouse over each marker.
	this.marker.addListener('mouseover', function() {
		this.setIcon(highlightedIcon);
	});

	// Create an on event to move mouse away from each marker.
	this.marker.addListener('mouseout', function() {
		this.setIcon(defaultIcon);
	});
}

// handle map error
function mapError() {
	alert('There is an error occurred for Google Maps!');
}

// Create shape and size of markers on the map
function makeMarkerIcon(markerColor) {
	var markerImage = new google.maps.MarkerImage(
		'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
		'|40|_|%E2%80%A2',
		new google.maps.Size(21, 34),
		new google.maps.Point(0, 0),
		new google.maps.Point(10, 34),
		new google.maps.Size(21,34));
	return markerImage;
}

// Marker bounces when place in the list is selected
var toggleBounce = function(marker) {
	if (marker.getAnimation() !== null) {
			marker.setAnimation(null);
	} else {
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			marker.setAnimation(null);
		}, 1200);
	}
};

// When marker on map is clicked  or place in list of side bar is selected, info window of marker populates
function populateInfoWindow(marker, infowindow, address, cityAndState) {
	// Check to make sure the infowindow is not already opened on this marker.
	if (infowindow.marker != marker) {
		// Clear the infowindow content to give the streetview time to load.
		infowindow.setContent('');
		infowindow.marker = marker;

		// Make sure the marker property is cleared if the infowindow is closed.
		infowindow.addListener('closeclick', function() {
			infowindow.marker = null;
		});
		var streetViewService = new google.maps.StreetViewService();
		var radius = 50;

		// In case the status is OK, which means the pano was found, compute the
		// position of the streetview image, then calculate the heading, then get a
		// panorama from that and set the options
		var infowindowContent = '<div><strong>' +  marker.name + '</strong></div>' +
						'<div>' + address + ',' + '</div>' +
						'<div>' + cityAndState +  '</div>';
		function getStreetView(data, status) {
			if (status == google.maps.StreetViewStatus.OK) {
				var nearStreetViewLocation = data.location.latLng;
				var heading = google.maps.geometry.spherical.computeHeading(
					nearStreetViewLocation, marker.position);
				infowindow.setContent(infowindowContent + '<div id="pano"></div>');
				var panoramaOptions = {
					position: nearStreetViewLocation,
					pov: {
					heading: heading,
					pitch: 25
					}
				};
				var panorama = new google.maps.StreetViewPanorama(
					document.getElementById('pano'), panoramaOptions);
			} else {
				infowindow.setContent(infowindowContent + '<div>No Street View Found</div>');
			}
		};

		// Use streetview service to get the closest streetview image within
		// pre-set radius of the markers position
		streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

		infowindow.open(map, marker);
	}
}

var ViewModel = function() {
	var self = this;

	this.queryItem = ko.observable("");
	this.listPos = ko.observableArray();

	this.showSidebar = ko.observable(true);

	window.addEventListener('resize', function(event){
		// get the width of the screen after the resize event
		var width = document.documentElement.clientWidth;

		// Show/hide sidebar and move toggle button when browser window is re-sized.
		if (width <= 768) {
			map.setZoom(12);
			self.showSidebar(false);
			document.getElementById('toggle-btn').style.left = "0px";
		} else if ((width <= 1080)) {
			map.setZoom(13);
			self.showSidebar(true);
			document.getElementById('toggle-btn').style.left = "200px";
		} else {
			map.setZoom(14);
			self.showSidebar(true);
			document.getElementById('toggle-btn').style.left = "200px";
		}
	});

	this.toggleVisibility = function() {
		self.showSidebar(!self.showSidebar());
		if (self.showSidebar() === true) {
			document.getElementById('toggle-btn').style.left = "200px";
		}
		else {
			document.getElementById('toggle-btn').style.left = "0px";
		}
	};

	locations.forEach(function(item) {
		self.listPos().push(new posMarker(item));
	});

	this.filteredLocations = ko.computed(function() {
		var s = self.queryItem().toLowerCase();
		if (!s) {
			self.listPos().forEach(function(item) {
				item.marker.setVisible(true);
			});
			return self.listPos();
		} else {
			return ko.utils.arrayFilter(self.listPos(), function(item) {
				var res = (item.name.toLowerCase().search(s) >= 0);
				item.marker.setVisible(res);

				// close the info window if it is open for another un-selected marker
				if (item.marker.visible === false) {
					infowindow.close();
				}

				return res;
			});
		}
	});

	self.setLoc = function(clickedLoc) {
		toggleBounce(clickedLoc.marker);
		populateInfoWindow(clickedLoc.marker, infowindow, clickedLoc.address, clickedLoc.cityAndState);
		map.panTo(clickedLoc.marker.getPosition());

		// Highlight the selected place in the list in the side menu
		$('li').on('click', function(){
			$('li').removeClass('active');
			$(this).toggleClass('active');
		});
	};
}
