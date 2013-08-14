//= require jquery
//= require leaflet
//= require mustache
//= require underscore
//= require backbone

(function () {

  // use custom marker icons for the campuses
  var CampusIcon = L.Icon.extend({
    options: {
      popupAnchor: [1, -32],
      campus: ''
    },

    initialize: function (options) {
      options = L.setOptions(this, options);
    },

    createIcon: function () {
      // build the icon as a div so we can style it via CSS
      var $marker = $('<div></div>');

      $marker.addClass('campus-marker');
      if (this.options.campus) {
        $marker.addClass('campus-marker-' + this.options.campus);
      }

      return $marker[0];
    },

    // create the shadow (we style it via CSS)
    createShadow: function () {
      var $shadow = $('<div></div>');
      $shadow.addClass('campus-marker-shadow');
      return $shadow[0];
    }
  });

  // compile the templates we'll be using
  var tmplCommunitySearchResult = Mustache.compile(
    $('#template-community-search-result').html());

  // checkbox filters
  var Filters = Backbone.Model.extend({
    defaults: {
      kinds: [],
      host_day: [],
      campus: []
    },

    // build the query string for the current filter selections
    toQueryString: function () {
      var enc = encodeURIComponent;
      return _.map(this.attributes, function (filterList, filterName) {
        return enc(filterName) + '=' + _.map(filterList, enc).join(',');
      }).join('&');
    }
  });

  var FiltersView = Backbone.View.extend({
    selectedTabClass: 'selected',

    events: {
      'click input[type="checkbox"]': 'handleFilterChange',
      'click nav a': 'handleTabClick'
    },

    initialize: function () {
      // cache references to some elements
      this.$filterTabs = this.$el.find('.filter-tab');
    },

    // update the model when a filter is changed
    handleFilterChange: function (e) {
      // update all the filters from the current checkbox states
      this.updateAllFilters();
    },

    // update the visible tab when one is clicked
    handleTabClick: function (e) {
      e.preventDefault();

      // select the nav button
      var $navButton = $(e.currentTarget);
      $navButton
          .addClass(this.selectedTabClass)
          .siblings()
          .removeClass(this.selectedTabClass);

      // select the corresponding tab
      this.$filterTabs.removeClass(this.selectedTabClass);
      var tabSelector = '#' + $(e.currentTarget).attr('data-tab-id');
      $(tabSelector).addClass(this.selectedTabClass);
    },

    // sync the current filter state to the model, causing change events for all
    // changed filter properties.
    updateAllFilters: function () {
      var newFilters = {};
      this.$el.find('.checkbox-filter input[type="checkbox"]').each(function () {
        var $checkbox = $(this);
        var filterName = $checkbox.attr('data-filter-name');
        var filterVal = $checkbox.val();

        // make sure there's an array for this filter
        newFilters[filterName] = newFilters[filterName] || [];

        // insert the filter into the list, keeping it sorted, if it's selected
        if ($checkbox.is(':checked')) {
          var filterList = newFilters[filterName];
          var insertIndex = _.sortedIndex(filterList, filterVal);
          filterList.splice(insertIndex, 0, filterVal);
        }
      });

      // compare all the values, and update those that have changed
      _.each(this.model.attributes, function (filterList, filterName) {
        // if the lists aren't equal, update the model attribute
        var newFilterList = newFilters[filterName];
        if (newFilterList && !_.isEqual(filterList, newFilterList)) {
          this.model.set(filterName, newFilterList);
        }
      }, this);
    },

    render: function () {
      // if nothing is checked, check the first tab
      if (this.$filterTabs.filter(this.selectedTabClass).length === 0) {
        this.$el.find('.filter-nav-button').first().trigger('click');
      }
    }
  });

  // a single point on the map
  var Point = Backbone.Model.extend({
    defaults: {
      id: '',
      campus: '',
      lat: null,
      lng: null,
      marker: null
    },

    hasGeodata: function () {
      return (this.get('lat') !== null && this.get('lng') !== null);
    }
  });

  var Points = Backbone.Collection.extend({ model: Point });

  var Map = Backbone.Model.extend({
    defaults: {
      // the center of the map, longitude/latitude (defaults to Austin, TX)
      center: [-97.7428, 30.2669],
      zoom: 13
    }
  });

  var MapView = Backbone.View.extend({
    // the leaflet map created on render
    leafletMap: null,

    // all points currently on the map, keyed to their slug
    points: new Points(),

    initialize: function (options) {
      this.listenTo(this.model, 'change', this.updateView);
    },

    // get all the initial points and add them to the map, zooming it to fit
    renderInitialPoints: function () {
      // do nothing if we don't have a map to work with
      if (!this.leafletMap) { return this; }

      // reset the points collection first
      this.points.reset();

      // pull down the point data
      $.getJSON('communities/points', _.bind(function (points) {
        // the bounds we'll zoom the map to
        var bounds = new L.LatLngBounds();

        _.each(points, function (pointData) {
          // store the point by its slug in our map
          var point = new Point({
            id: pointData.properties.slug,
            campus: pointData.properties.campus
          });

          // set the geo data on the point model if possible
          if (pointData.geometry) {
            point.set({
              lng: pointData.geometry.coordinates[0],
              lat: pointData.geometry.coordinates[1]
            });
          }

          // store the point away
          this.points.add(point);

          // only add the point to the map if it has geodata available
          if (point.hasGeodata()) {
            // add a marker to the map and add its point to the bounds
            var latlng = new L.LatLng(point.get('lat'), point.get('lng'));

            var marker = L.marker(latlng, {
              // the campus values here and in the stylesheets correspond to the
              // keys in Community::CAMPUSES enum.
              icon: new CampusIcon({ campus: point.get('campus') }),
              riseOnHover: true
            });

            // store the marker reference on the point
            point.set('marker', marker);

            // add the marker to the map and the bounds
            marker.addTo(this.leafletMap);
            bounds.extend(latlng);
          }
        }, this);

        // zoom the map to include all the markers, leaving room for the controls
        this.leafletMap.fitBounds(bounds, {
          paddingBottomRight: [320, 0]
        });
      }, this));
    },

    render: function () {
      // only render once, since we don't want to re-create the map every time
      if (!this.leafletMap) {
        var center = this.model.get('center');
        var latlng = new L.LatLng(center[1], center[0]);

        // create the map, rendering it into the DOM
        this.leafletMap = L.map(this.el, {
          // center on Austin until points are loaded
          center: latlng,
          zoom: this.model.get('zoom'),

          // TODO: put the Esri attribution SOMEWHERE
          attributionControl: false
        });

        // add the Esri map tiles layer (free!)
        L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
          detectRetina: true,
          reuseTiles: true
        }).addTo(this.leafletMap);

        // add all the initial points to the map and cache them locally
        this.renderInitialPoints();
      }
    },

    updateView: function () {
      if (this.leafletMap) {
        // animate a pan to the new position
        var center = this.model.get('center');
        var latlng = new L.LatLng(center[1], center[1]);

        this.leafletMap.setView(latlng, this.model.get('zoom'), {
          animate: true
        });
      }
    }
  });

  // a single community
  var Community = Backbone.Model.extend({
    defaults: {
      id: '',
      campus: '',
      email: '',
      leader_first_name: '',
      leader_last_name: '',
      coleader_first_name: null,
      coleader_last_name: null,
      host_day: '',
      description: null,
      kinds: [],

      lat: null,
      lng: null,

      address: {
        line_1: '',
        line_2: null,
        city: '',
        province: '',
        postal: ''
      }
    },

    parse: function (responseJSON) {
      console.log(responseJSON);

      // parse the server response into a simpler model
      var attributes = {
        id: responseJSON.slug,
        campus: responseJSON.campus,
        email: responseJSON.email,
        leader_first_name: responseJSON.leader_first_name,
        leader_last_name: responseJSON.leader_last_name,
        coleader_first_name: responseJSON.coleader_first_name,
        coleader_last_name: responseJSON.coleader_last_name,
        host_day: responseJSON.host_day,
        description: responseJSON.description,
        kinds: responseJSON.kinds.sort(),

        // these need special treatment
        address: null,
        lat: null,
        lng: null
      };

      // add the geolocation info if available
      if (responseJSON.location) {
        if (responseJSON.location.geometry) {
          attributes.lat = responseJSON.location.geometry.coordinates[1];
          attributes.lng = responseJSON.location.geometry.coordinates[0];
        }

        attributes.address = responseJSON.location.properties.address;
      }

      return attributes;
    }
  });

  var Communities = Backbone.Collection.extend({
    baseURL: '/communities',
    filtersQueryString: '',

    model: Community,

    // dynamically build the URL from the base plus the filters
    url: function () {
      return this.baseURL + '?' + this.filtersQueryString;
    },

    // update our URL to reflect the given filters model
    updateFilters: function (filters) {
      this.filtersQueryString = filters.toQueryString();
    }
  });

  var CommunitiesView = Backbone.View.extend({
    // the filters that we watch for changes to pull new communities
    model: null,

    // the collection of communities to manage
    collection: null,

    initialize: function () {
      // update our URL whenever the filters change
      this.listenTo(this.model, 'change', this.updateCollectionFilters);

      // re-render whenever the collection changes
      this.listenTo(this.collection, 'change', this.render);
      this.listenTo(this.collection, 'reset', this.render);
      this.listenTo(this.collection, 'sync', this.render);
    },

    // update our communities' URL to match the filters, then update the collection
    updateCollectionFilters: function () {
      this.collection.updateFilters(this.model);
      this.collection.fetch();
    },

    // set the search results to reflect the searched communities
    render: function () {
      // clear out the old communities and add the new ones
      this.$el.empty();
      this.collection.each(function (community) {
        this.$el.append(tmplCommunitySearchResult(community.toJSON()));
      }, this);
    }

  });

  var AppView = Backbone.View.extend({

    filters: new Filters(),
    map: new Map(),
    communities: null,

    mapView: null,
    filtersView: null,

    initialize: function () {
      this.filtersView = new FiltersView({
        el: $('#filters'),
        model: this.filters
      });

      // ensure the model has its filters updated to match the DOM
      this.filtersView.updateAllFilters();

      this.mapView = new MapView({
        el: $('#map'),
        model: this.map
      });

      this.communities = new Communities();
      this.communitiesView = new CommunitiesView({
        el: $('#search-results'),
        model: this.filters,
        collection: this.communities
      });

      // load the initial list of communities from the server, forcing a render
      this.communities.fetch();
    },

    render: function () {
      this.filtersView.render();
      this.mapView.render();

      return this;
    }

  });

  // start the app!
  var app = new AppView().render();

}());
