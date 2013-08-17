//= require jquery
//= require leaflet
//= require Control.Loading
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
      kind: [],
      day: [],
      campus: []
    }
  });

  var FiltersView = Backbone.View.extend({
    selectedTabClass: 'selected',

    events: {
      'click input[type="checkbox"]': 'handleFilterChange',
      'click nav a': 'handleTabClick'
    },

    initialize: function () {
      this.$filterTabs = this.$el.find('.filter-tab');
    },

    // update the model when a filter is changed
    handleFilterChange: function (e) {
      // update all the filters from the current checkbox states
      this.updateAllFilters();
      return this;
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

      return this;
    },

    render: function () {
      // if nothing is checked, check the first tab
      if (this.$filterTabs.filter(this.selectedTabClass).length === 0) {
        this.$el.find('.filter-nav-button').first().trigger('click');
      }

      return this;
    }
  });

  var Map = Backbone.Model.extend({
    defaults: {
      // the center of the map, longitude/latitude (defaults to Austin, TX)
      center: [-97.7428, 30.2669],
      zoom: 13
    }
  });

  var MapView = Backbone.View.extend({
    // the leaflet map created on render
    map: null,

    communities: null,

    // a list of all markers currently on the map
    markers: [],

    initialize: function (options) {
      this.communities = options.communities;
      this.sidebarPadding = options.sidebar_padding;

      this.listenTo(this.model, 'change', this.updateView);

      this.listenTo(this.communities, 'change',
          _.partial(this.renderMarkers, this.communities));
      this.listenTo(this.communities, 'reset',
          _.partial(this.renderMarkers, this.communities));
      this.listenTo(this.communities, 'sync',
          _.partial(this.renderMarkers, this.communities));

      // toggle a loading control while the communities list is syncing
      this.listenTo(this.communities, 'request', this.showLoadingControl);
      this.listenTo(this.communities, 'sync', this.hideLoadingControl);

      // zoom the map to fit all the communities on the first update only
      this.listenToOnce(this.communities, 'sync', this.zoomToFitCommunities);
    },

    showLoadingControl: function () {
      this.map.fireEvent('dataloading');
    },

    hideLoadingControl: function () {
      this.map.fireEvent('dataload');
    },

    zoomToFitCommunities: function () {
      // the bounds we'll zoom the map to
      var bounds = L.latLngBounds(_.compact(this.communities.map(function (c) {
        return c.get('latlng');
      })));

      // zoom the map to include all the markers, leaving room for the sidebar
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, {
          paddingBottomRight: [this.sidebarPadding, 0]
        });
      }

      return this;
    },

    render: function () {
      // only render once, since we don't want to re-create the map every time
      if (!this.map) {
        var center = this.model.get('center');
        var latlng = new L.LatLng(center[1], center[0]);

        // create the map, rendering it into the DOM
        this.map = L.map(this.el, {
          // center on Austin until communities are loaded
          center: latlng,
          zoom: this.model.get('zoom'),

          loadingControl: true,

          // the Esri map tiles don't go down further than this
          maxZoom: 17,

          // TODO: put the Esri attribution SOMEWHERE
          attributionControl: false
        });

        // add the Esri map tiles layer (free!)
        L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
          // detectRetina: true,
          // reuseTiles: true
        }).addTo(this.map);
      }

      return this;
    },

    // render all the markers from the communities list
    renderMarkers: function (communities) {
      var presentMarkers = {};
      communities.each(function (community) {
        // only add the community to the map if it has geodata available
        if (community.hasGeodata()) {
          var marker = this.markers[community.id];

          // create a new marker and add it to the map if it's not already on it
          if (!marker) {
            marker = L.marker(community.get('latlng'), {
              // the campus values here and in the stylesheets correspond to the
              // keys in Community::CAMPUSES enum.
              icon: new CampusIcon({ campus: community.get('campus') }),
              riseOnHover: true
            });

            // add the marker to the map and store it for later reference
            marker.addTo(this.map);
          }

          // label the marker as 'present'
          presentMarkers[community.id] = marker;
        }
      }, this);

      // remove non-present markers from the map
      _.each(this.markers, function (value, id) {
        if (!presentMarkers[id]) {
          this.map.removeLayer(this.markers[id]);
        }
      }, this);

      // update the cache to include only the present markers
      this.markers = presentMarkers;

      return this;
    },

    updateView: function () {
      if (this.map) {
        // animate a pan to the new position
        var center = this.model.get('center');
        var latlng = new L.LatLng(center[1], center[0]);

        this.map.setView(latlng, this.model.get('zoom'), {
          animate: true
        });
      }

      return this;
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

    initialize: function () {
      // store our LatLng for use with leaflet, if possible
      if (this.hasGeodata()) {
        this.set('latlng', new L.LatLng(this.get('lat'), this.get('lng')));
      } else {
        this.set('latlng', null);
      }

      // cache a textual field that contains all our filterable information, so
      // we can search it via regex (faster than using functions).
      var parts = this.get('kinds').concat([
        this.get('campus'),
        this.get('host_day')
      ]);

      this.set('filterString', parts.join(' '));
    },

    parse: function (responseJSON) {
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
    },

    hasGeodata: function () {
      return (this.get('lat') !== null && this.get('lng') !== null );
    }

  });

  var Communities = Backbone.Collection.extend({
    // load all the communities!
    url: '/communities?limit=99999',
    model: Community,

    index: {},

    initialize: function () {
      this.on('sync', this.buildIndex);
      this.on('change', this.buildIndex);
      this.on('reset', this.buildIndex);
    },

    // build a search index for all the communities
    buildIndex: function () {
      this.index = {};

      // index all the communtiy values to their id, for lookup by value
      this.each(function (community) {
        var id = community.get('id');
        var kinds = community.get('kinds');
        var day = community.get('host_day');
        var campus = community.get('campus');

        this.index[day] = this.index[day] || {};
        this.index[day][id] = community;

        this.index[campus] = this.index[campus] || {};
        this.index[campus][id] = community;

        _.each(kinds, function (kind) {
          this.index[kind] = this.index[kind] || {};
          this.index[kind][id] = community;
        }, this);

      }, this);

      return this;
    },

    // query the index and return a list of community ids that satisfy the query
    query: function (campuses, days, kinds) {
      var campusIds = {};
      var dayIds = {};
      var kindIds = {};

      _.each(campuses, function (campus) {
        _.extend(campusIds, this.index[campus]);
      }, this);

      _.each(days, function (day) {
        _.extend(dayIds, this.index[day]);
      }, this);

      _.each(kinds, function (kind) {
        _.extend(kindIds, this.index[kind]);
      }, this);

      var keyMap = {};
      _.extend(keyMap, campusIds);
      _.extend(keyMap, dayIds);
      _.extend(keyMap, kindIds);

      var ids = {};
      _.each(keyMap, function (v, id) {
        if (campusIds[id] && dayIds[id] && kindIds[id]) {
          // get community from a map, they're all the same
          ids[id] = campusIds[id];
        }
      });

      // return the matching ids as a set
      return _.values(ids);
    }
  });

  var CommunitiesView = Backbone.View.extend({
    // the filters that we watch for changes to pull new communities
    filters: null,

    // a reference to the map view, so we can tell it to re-render markers
    mapView: null,

    // the collection of communities to manage
    collection: null,

    initialize: function (options) {
      this.filters = options.filters;
      this.mapView = options.mapView;

      // update our URL whenever the filters change
      this.listenTo(this.filters, 'change', this.render);

      // re-render whenever the collection changes
      this.listenTo(this.collection, 'change', this.render);
      this.listenTo(this.collection, 'reset', this.render);
      this.listenTo(this.collection, 'sync', this.render);
    },

    // set the search results to reflect the searched communities
    render: function () {
      // clear out the old communities and add the new ones
      this.$el.empty();

      var filteredResults = this.collection.query(
        this.filters.get('campus'),
        this.filters.get('day'),
        this.filters.get('kind')
      );

      // TODO: DOM modification is slow -- OPTIMIZE!!!

      _.each(filteredResults, function (community) {
        var $result = $(tmplCommunitySearchResult(community.toJSON()));
        this.$el.append($result);
      }, this);

      this.mapView.renderMarkers(_(filteredResults));

      return this;
    }

  });

  var AppView = Backbone.View.extend({

    filters: new Filters(),
    map: new Map(),
    communities: new Communities(),

    mapView: null,
    filtersView: null,

    initialize: function () {
      this.filtersView = new FiltersView({
        el: $('#filters'),
        model: this.filters
      }).updateAllFilters().render();

      this.mapView = new MapView({
        el: $('#map'),
        model: this.map,
        communities: this.communities,
        sidebar_padding: 320
      }).render();

      this.communitiesView = new CommunitiesView({
        el: $('#search-results'),
        mapView: this.mapView,
        filters: this.filters,
        collection: this.communities
      });

      // load initial community data from the server, which updates the map
      // search results.
      this.communities.fetch();
    }

  });

  // start the app!
  var app = new AppView();

}());
