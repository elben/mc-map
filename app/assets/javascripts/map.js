//= require jquery
//= require leaflet
//= require Control.Loading
//= require mustache
//= require underscore
//= require backbone

(function () {

  var SUPPORTS_CSS_ANIMATION = $('html').hasClass('cssanimations');

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
      'change input[type="checkbox"]': 'handleFilterChange',
      'click nav a': 'handleTabSelect',
      'click .checkbox-only': 'handleOnlyClick'
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

    // update the visible tab when one is selected
    handleTabSelect: function (e) {
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

    // select only the clicked checkbox, deselecting all others
    handleOnlyClick: function (e) {
      e.preventDefault();
      var $filter = $(e.currentTarget).parents('.checkbox-filter');
      var $checkbox = $filter.find('input[type="checkbox"]');

      // check the current checkbox
      $checkbox.prop('checked', true);

      // uncheck all sibling checkboxes
      $filter.siblings().find('input[type="checkbox"]').prop('checked', false);

      // update filters, since no event gets triggered by 'prop'
      this.handleFilterChange();

      return this;
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

    // a cache of all markers currently on the map
    markers: {},

    initialize: function (options) {
      var defaults = {
        marker_toggle_duration_ms: 250,
        marker_selected_class: 'campus-marker-selected',
        marker_dimmed_class: 'campus-marker-dimmed',
        marker_remove_class: 'campus-marker-remove'
      };
      this.options = $.extend(defaults, options);

      this.communities = options.communities;

      this.listenTo(this.model, 'change', this.updateView);

      // re-render markers whenever the communities change
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

      // zoom the map to include all the markers
      if (bounds.isValid()) {
        this.map.fitBounds(bounds);
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

        // bind specific events for the map
        this.map.on('moveend', _.bind(this.handleViewChange, this));
        this.map.on('click', _.bind(this.handleClick, this));
      }

      return this;
    },

    // render all the markers from the communities list
    renderMarkers: function (communities) {
      var presentMarkers = {};
      communities.each(function (community) {
        // only add the community to the map if it has geodata available
        if (community.hasGeodata()) {
          // try to retrieve the marker from the cache
          var marker = this.markers[community.id];

          // create a new marker and add it to the map if it's not already on it
          if (!marker) {
            marker = L.marker(community.get('latlng'), {
              // the campus values here and in the stylesheets correspond to the
              // keys in Community::CAMPUSES enum.
              icon: new CampusIcon({ campus: community.get('campus') }),

              // store this for later reference
              communityId: community.id,

              riseOnHover: true
            });

            // listen to this marker's click event
            marker.on('click', _.bind(this.handleMarkerClick, this));

            // cache the marker for later use
            this.markers[community.id] = marker;
          }

          // label the marker as 'present' for this update
          presentMarkers[community.id] = true;
        }
      }, this);

      // remove non-present markers and enable present ones
      _.each(this.markers, function (marker, id) {
        var fun = _.bind(function () { this.map.addLayer(marker); }, this);

        if (!presentMarkers[id]) {
          // remove the marker after the delay fires
          fun = _.bind(function () {
            // tell the marker DOM to style itself for fade-out
            var $icon = $(marker._icon);
            var $shadow = $(marker._shadow);
            $icon.addClass(this.options.marker_remove_class);
            $shadow.addClass(this.options.marker_remove_class);

            // remove the marker once its animation is done
            if (SUPPORTS_CSS_ANIMATION) {
              _.delay(_.bind(function () {
                // reset the marker style
                $icon.removeClass(this.options.marker_remove_class);
                $shadow.removeClass(this.options.marker_remove_class);
                this.map.removeLayer(marker);
              }, this), 250);
            } else {
              $marker.removeClass(this.options.marker_remove_class);
              this.map.removeLayer(marker);
            }
          }, this);
        }

        // add or remove the marker as specified
        _.delay(fun, Math.random() * this.options.marker_toggle_duration_ms);
      }, this);

      return this;
    },

    // remove the highlight from all markers
    unhighlightMarkers: function () {
      _.each(this.markers, function (marker, id) {
        var $icon = $(marker._icon);
        var $shadow = $(marker._shadow);

        // un-dim/select all markers
        $icon.removeClass(this.options.marker_dimmed_class);
        $icon.removeClass(this.options.marker_selected_class);
        $shadow.removeClass(this.options.marker_dimmed_class);
        $shadow.removeClass(this.options.marker_selected_class);

        // reset their offsets
        marker.setZIndexOffset(0);
      }, this);

      return this;
    },

    // dim all the markers but this one
    highlightMarker: function (visibleId) {
      // dim all the markers except for the selected one
      _.each(this.markers, function (marker, id) {
        var $icon = $(marker._icon);
        var $shadow = $(marker._shadow);

        // add a 'dimmed' class to all other markers
        if (marker.options.communityId !== visibleId) {
          $icon.addClass(this.options.marker_dimmed_class);
          $shadow.addClass(this.options.marker_dimmed_class);
        } else {
          // raise the selected marker above all others and mark it 'selected'
          $icon.addClass(this.options.marker_selected_class);
          $shadow.addClass(this.options.marker_selected_class);
          marker.setZIndexOffset(1000);
        }
      }, this);

      return this;
    },

    updateView: function () {
      if (this.map) {
        // animate a pan to the new position, accounting for the sidebar
        var center = this.model.get('center');
        var latlng = new L.LatLng(center[1], center[0]);

        this.map.setView(latlng, this.model.get('zoom'), {
          animate: true
        });
      }

      return this;
    },

    // return the ids of currently in-view communities
    getVisibleCommunityIds: function () {
      var viewBounds = this.map.getBounds();

      var visibleCommunityIds = _.chain(this.markers).map(function (m, id) {
          if (viewBounds.contains(m.getLatLng())) { return id; }
        }).compact().value();

      // make sure the order is consistent
      return visibleCommunityIds.sort();
    },

    // trigger an event when the map view changes
    handleViewChange: function () {
      var viewBounds = this.map.getBounds();

      // send listeners the new bounds and a list of visible markers
      this.trigger('viewchange', viewBounds, this.getVisibleCommunityIds());

      return this;
    },

    // trigger an event when a marker is clicked
    handleMarkerClick: function (e) {
      var marker = e.target;
      this.trigger('markerclick', marker, marker.options.communityId);
      return this;
    },

    // unhighlight all markers and send a generic click event
    handleClick: function (e) {
      this.unhighlightMarkers();
      this.trigger('click', e.latlng);
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
      kinds: {},

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
        kinds: responseJSON.kinds,

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
        var kinds = _.keys(community.get('kinds'));
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

    template: tmplCommunitySearchResult,

    events: {
      'scroll': 'handleResultsScroll',
      'click .community-search-result': 'handleResultClick',
      'click .community-search-result-sign-up-button': 'handleSignUpClick'
    },

    // the most recent filtered results
    filteredResults: [],

    // a list of ids of communities that are currently in-view
    visibleCommunityIds: [],

    // the id of the most recently-selected community
    selectedCommunityId: null,

    initialize: function (options) {
      var defaults = {
        result_selected_class: 'selected'
      };
      this.options = $.extend(defaults, options);

      this.filters = options.filters;
      this.mapView = options.mapView;

      // update our URL whenever the filters change
      this.listenTo(this.filters, 'change', this.render);

      // re-render whenever the collection changes
      this.listenTo(this.collection, 'change', this.render);
      this.listenTo(this.collection, 'reset', this.render);
      this.listenTo(this.collection, 'sync', this.render);

      // update the search results list when the map view changes
      this.listenTo(this.mapView, 'viewchange', this.handleMapViewChange);
      this.listenTo(this.mapView, 'markerclick', this.handleMapMarkerClick);
      this.listenTo(this.mapView, 'click', this.handleMapClick);
    },

    // render a community and return the rendered jQuery object
    renderCommunity: function (community) {
      var json = community.toJSON();

      // make 'kinds' into a list of display names, not enum values
      var kinds = _.values(community.get('kinds'));
      json.kinds = kinds;

      var $community = $(this.template(json));

      // mark the community as selected if it's the currently-selected one
      $community.toggleClass(this.options.result_selected_class,
          community.get('id') === this.selectedCommunityId);

      return $community;
    },

    // score a community by the number of filters it matches
    scoreCommunity: function (community) {
      var score = 0;

      // a larger number of matching type filters is better
      var kinds = community.get('kinds');
      score += _.filter(this.filters.get('kind'), function (k) {
        return _.has(kinds, k);
      }).length;

      // presence in the visible results is even better
      if (_.contains(this.visibleCommunityIds, community.get('id'))) {
        score += 10;
      }

      // having the same matching filters is better still
      if (this.filters.get('kind').length === score) {
        score += 100;
      }

      // being the selected community is worth even more
      if (this.selectedCommunityId === community.get('id')) {
        score += 1000;
      }

      return score;
    },

    // set the search results to reflect the searched communities
    render: function () {
      this.mapView.unhighlightMarkers();

      // get and store the filtered results
      this.filteredResults = this.collection.query(
        this.filters.get('campus'),
        this.filters.get('day'),
        this.filters.get('kind')
      );

      // update the visible communities
      this.visibleCommunityIds = this.mapView.getVisibleCommunityIds();

      // re-sort, then render the search results
      this.renderSearchResults();

      // render markers for all the results
      this.mapView.renderMarkers(_(this.filteredResults));

      return this;
    },

    // render the list of search results
    renderSearchResults: function () {
      // make sure the results are sorted
      this.sortFilteredResults();

      // clear out old communities, keeping the selected community if it exists
      var id = this.selectedCommunityId;
      this.$el.children(':not([data-id="' + id + '"])').remove();

      // render an amount of communities necessary to force the list to scroll
      _.every(this.filteredResults, function (community) {
        // render the community if it's not the selected one, or if there is no
        // currently selected community, but there should be
        if (community.get('id') !== id ||
            (this.$el.children('[data-id="' + id + '"]').length === 0 && id)) {
          var $community = this.renderCommunity(community);
          this.$el.append($community);
        }

        // return false if we're done, canceling iteration
        return this.$el[0].scrollHeight <= $(window).height();
      }, this);

      // make sure the selected community is/stays selected
      this.$el.children('[data-id="' + id + '"]')
          .addClass(this.options.result_selected_class);

      return this;
    },

    // render more community results into the results list
    renderMoreResults: function (numberToRender) {
      numberToRender = numberToRender || 25;

      var index = this.$el.children().length;
      var endIndex = Math.min(index + numberToRender,
          this.filteredResults.length - 1);

      // render some more community results
      for (; index < endIndex; index++) {
        var community = this.filteredResults[index];
        var $community = this.renderCommunity(community);
        this.$el.append($community);
      }

      return this;
    },

    // sort the latest filtered results by relevance
    sortFilteredResults: function () {
      // sort most highly-scored communities first
      this.filteredResults = _.sortBy(this.filteredResults,
          _.bind(this.scoreCommunity, this)).reverse();

      return this;
    },

    handleResultsScroll: function (e) {
      // see if we're near the bottom
      var scrollHeight = this.$el[0].scrollHeight;
      var scrollBottom = this.$el.scrollTop() + this.$el.height();

      // if we're withing some margin of the bottom, render more communities
      if (scrollBottom >= scrollHeight - 200) {
        this.renderMoreResults();
      }

      return this;
    },

    // highlight the marker for the clicked result
    handleResultClick: function (e) {
      var $result = $(e.currentTarget);
      var communityId = $result.attr('data-id');

      // select the result, deselecting all others
      $result
          .addClass(this.options.result_selected_class)
          .siblings()
          .removeClass(this.options.result_selected_class);

      // select this result
      this.selectedCommunityId = communityId;

      // highlight its marker
      this.mapView
          .unhighlightMarkers()
          .highlightMarker(communityId);

      return this;
    },

    handleMapViewChange: function (viewBounds, visibleCommunityIds) {
      // store the visible communities for sorting search results
      this.visibleCommunityIds = visibleCommunityIds;
      this.renderSearchResults();
      return this;
    },

    // set the clicked marker as the selected one
    handleMapMarkerClick: function (marker, id) {
      this.selectedCommunityId = id;
      this.mapView.unhighlightMarkers().highlightMarker(id);
      this.renderSearchResults();
      return this;
    },

    // un-highlight the selected result when the map is clicked
    handleMapClick: function (latlng) {
      this.selectedCommunityId = null;
      this.$el.children().removeClass(this.options.result_selected_class);
      return this;
    },

    // show the sign-up page in an iframe when the sign-up button is clicked
    handleSignUpClick: function (e) {

    },

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
        communities: this.communities
      }).render();

      this.communitiesView = new CommunitiesView({
        el: $('#search-results'),
        mapView: this.mapView,
        filters: this.filters,
        collection: this.communities
      });

      // load initial community data from the server, updating the view
      this.communities.fetch();
    }

  });

  // start the app!
  var app = new AppView();

}());
