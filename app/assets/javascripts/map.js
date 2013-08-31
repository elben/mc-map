//= require jquery
//= require leaflet
//= require leaflet.markercluster
//= require Control.Loading
//= require mustache
//= require underscore
//= require backbone
//= require scrollfix

(function () {

  // use custom marker icons for the communities
  var CommunityIcon = L.Icon.extend({
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

      $marker.addClass('community-marker');
      if (this.options.campus) {
        $marker.addClass('community-marker-' + this.options.campus);
      }

      return $marker[0];
    },

    // create the shadow (we style it via CSS)
    createShadow: function () {
      var $shadow = $('<div></div>');
      $shadow.addClass('community-marker-shadow');
      return $shadow[0];
    }
  });

  // create the icon used for cluster indicators
  var createClusterIcon = function (cluster) {
    var childCount = cluster.getChildCount();

    var iconSize = 'large';
    if (childCount < 10) {
      iconSize = 'small';
    } else if (childCount < 100) {
      iconSize = 'medium';
    }

    // a lightweight icon for the cluster
    return new L.DivIcon({
      // the HTML that goes inside the parent div
      html: '<span>' + childCount + '</span>',
      className: 'marker-cluster marker-cluster-' + iconSize
    });
  };

  // parse a query string
  var parseParams = function (params) {
    var qs = params.split('?')[1];
    var results = {};

    if (qs) {
      var pairs = qs.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var parts = pairs[i].split('=');
        results[parts[0]] = decodeURIComponent(parts[1]);
      }
    }

    return results;
  };

  // checkbox filters
  var Filters = Backbone.Model.extend({
    defaults: {
      kind: [],
      day: [],
      campus: []
    }
  });

  var FiltersView = Backbone.View.extend({
    events: {
      'change .checkbox-filter input[type="checkbox"]': 'handleFilterChange',
      'change #toggle-selection-checkbox': 'handleToggleChange',

      'click nav a': 'handleTabSelect',
      'touchstart nav a': 'handleTabSelect',

      'click .checkbox-only': 'handleOnlyClick',
      'touchstart .checkbox-only': 'handleOnlyClick',

      'click #filters-header': 'handleHeaderClick'
    },

    initialize: function (options) {
      var defaults = {
        disabled_class: 'disabled',
        selected_tab_class: 'selected'
      };
      this.options = $.extend(defaults, options);

      this.$filterTabs = this.$el.find('.filter-tab');
      this.$toggleCheckbox = this.$el.find('#toggle-selection-checkbox');
    },

    // update the model when a filter is changed
    handleFilterChange: function (e) {
      // update all the filters from the current checkbox states
      this.updateAllFilters();

      var $checkbox = $(e.currentTarget);

      // send the event with value 1 indicate 'checked', or 0 for 'unchecked'
      trackEvent('filters', 'change', 'checkbox:' + $checkbox.attr('id'),
          $checkbox.prop('checked') + 0);

      return this;
    },

    // update the visible tab when one is selected
    handleTabSelect: function (e) {
      e.preventDefault();

      // select the nav button
      var $navButton = $(e.currentTarget);
      $navButton
          .addClass(this.options.selected_tab_class)
          .siblings()
          .removeClass(this.options.selected_tab_class);

      // select the corresponding tab
      this.$filterTabs.removeClass(this.options.selected_tab_class);
      var tabSelector = '#' + $(e.currentTarget).attr('data-tab-id');
      $(tabSelector).addClass(this.options.selected_tab_class);

      trackEvent('filters', 'click', 'tab:' + $navButton.attr('data-tab-id'));

      return this;
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
      this.updateAllFilters();

      trackEvent('filters', 'click', 'only:' + $checkbox.attr('id'));

      return this;
    },

    // toggle all checkboxes when the toggle checkbox changes
    handleToggleChange: function (e) {
      e.preventDefault();

      var $checkbox = $(e.currentTarget);

      // get the checkboxes in the currently selected filter tab
      var $selectedTab = this.$filterTabs
          .filter('.' + this.options.selected_tab_class);
      var $checkboxes = $selectedTab
          .find('.checkbox-filter input[type="checkbox"]');

      // first, get the state of all the checkboxes
      var checkboxStates = $checkboxes.map(function () {
        var $checkbox = $(this);
        return $checkbox.prop('checked');
      });

      var allChecked = _.every(checkboxStates);

      // if they're all checked, uncheck them. otherwise, check them.
      $checkboxes.prop('checked', !allChecked);

      // set the checkbox's state to match the current state of its charges. if
      // they're all checked (or some are checked), it's unchecked. otherwise,
      // it's checked. o, for a native tri-state checkbox...
      $checkbox.prop('checked', !allChecked);

      // update filters, since no event gets triggered by 'prop'
      this.updateAllFilters();

      trackEvent('filters', 'click', 'toggle-all:' + $selectedTab.attr('id'));

      return this;
    },

    // emit an event when the header is clicked
    handleHeaderClick: function (e) {
      e.preventDefault();
      this.trigger('headerclick');

      trackEvent('filters', 'click', 'header');

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
      var $selectedTabs = this.$filterTabs
          .filter('.' + this.options.selected_tab_class);
      if ($selectedTabs.length === 0) {
        this.$el.find('.filter-nav-button').first().trigger('click');
      }

      // fix scrolling for all filter tabs
      this.$filterTabs.each(function () {
        var $content = $(this).find('.filter-tab-content');
        new ScrollFix($content[0]);
      });

      // if we got a 'campus' param in the URL, check only that corresponding
      // checkbox.
      var url = document.location.href;
      if (window.location !== window.parent.location) {
        // get referrer's URL to parse from parent iframe
        url = document.referrer;
      }

      var params = parseParams(url);

      // use the campus param as the sole campus filter if specified
      if (params.campus) {
        // see whether a corresponding checkbox exists
        var $filter = this.$el.find('.checkbox-filter-campus-' + params.campus);

        // if we got a checkbox, check ONLY it, none of its siblings
        if ($filter.length > 0) {
          // uncheck all the checkboxes for the campus tab
          this.$el.find('.checkbox-filter-campus input[type="checkbox"]')
              .prop('checked', false);

          // check only our checkbox
          $filter.find('input[type="checkbox"]').prop('checked', true);
        }
      }

      // update the model from the filter checkboxes
      this.updateAllFilters();

      return this;
    },

    // toggle the display of the filters on or off
    toggle: function (enable) {
      this.$el.toggleClass(this.options.disabled_class, !enable);
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

    markers: {},

    // the Esri map tiles layer (free!)
    tileLayer: L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
      detectRetina: true,
      reuseTiles: true
    }),

    // markers currently on the map
    markerLayer: L.markerClusterGroup({
      removeOutsideVisibleBounds: true,
      zoomToBoundsOnClick: true,
      showCoverageOnHover: true,
      spiderifyOnMaxZoom: true,
      maxClusterRadius: 30,
      iconCreateFunction: createClusterIcon
    }),

    initialize: function (options) {
      var defaults = {
        marker_toggle_duration_ms: 250,
        marker_selected_class: 'community-marker-selected',
        marker_dimmed_class: 'community-marker-dimmed'
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

      // listen to marker click events
      this.markerLayer.on('click', _.bind(this.handleMarkerClick, this));
      this.markerLayer.on('clusterclick', _.bind(this.handleClusterClick, this));

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
        var latlng = L.latLng(center[1], center[0]);

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

        // add the map tiles layer
        this.map.addLayer(this.tileLayer);

        // bind specific events for the map
        this.map.on('moveend', _.bind(this.handleViewChange, this));
        this.map.on('click', _.bind(this.handleClick, this));
        this.map.on('dragstart', _.bind(this.handleUserDrag, this));

        this.map.addLayer(this.markerLayer);
      }

      return this;
    },

    // render all the markers from the communities list
    renderMarkers: function (communities) {
      // add updated markers to the marker layer
      var markers = [];
      communities.each(function (community) {
        // only add the community to the map if it has geodata available
        if (community.hasGeodata()) {
          var communityId = community.get('id');
          var marker = this.markers[communityId];

          // create a new marker if we couldn't find one in the cache
          if (!marker) {
            marker = L.marker(community.get('latlng'), {
              // the campus values here and in the stylesheets correspond to the
              // keys in Community::CAMPUSES enum.
              icon: new CommunityIcon({ campus: community.get('campus') }),

              // store this for later reference
              communityId: community.id,

              riseOnHover: true
            });

            // cache the marker for re-use later
            this.markers[communityId] = marker;
          }

          // add the marker to this round's render list
          markers.push(marker);
        }
      }, this);

      // swap old markers and new markers all at once
      this.markerLayer.clearLayers();
      this.markerLayer.addLayers(markers);

      return this;
    },

    // remove the highlight from all markers
    unHighlightMarkers: function () {
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
      // remove any old highlight
      this.unHighlightMarkers();

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

    // track when a user drags the map
    handleUserDrag: function (e) {
      trackEvent('map', 'drag', 'user-initiated');
      return this;
    },

    // trigger an event when a marker is clicked
    handleMarkerClick: function (e) {
      var marker = e.layer;
      this.trigger('markerclick', marker, marker.options.communityId);

      trackEvent('map', 'click', 'marker:' + marker.options.communityId);

      return this;
    },

    // trigger an event when a marker is clicked
    handleClusterClick: function (e) {
      trackEvent('map', 'click', 'cluster');
      return this;
    },

    // unhighlight all markers and send a generic click event
    handleClick: function (e) {
      this.unHighlightMarkers();
      this.trigger('click', e.latlng);
      return this;
    },

    // pan/zoom the map to show a community, calling the callback when done
    showCommunity: function (id, callback, context) {
      // find the given marker
      var marker = this.markers[id];

      // zoom to it if it exists
      if (marker) {
        this.markerLayer.zoomToShowLayer(marker, function () {
          if (typeof callback === 'function') {
            callback.call(context || this);
          }
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
      campus_display: '',
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
        campus_display: responseJSON.campus_display,
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

    template: Mustache.compile(
        $('#template-community-search-result').html()),
    frameTemplate: Mustache.compile(
        $('#template-community-search-result-frame').html()),

    events: {
      'click .community-search-result': 'handleResultClick',

      'click .community-search-result-sign-up-button': 'handleSignUpClick',
      'touchend .community-search-result-sign-up-button': 'handleMobileSignUpClick',

      'click #search-results-header': 'handleHeaderClick'
    },

    // flag so we don't re-fix the scrollable area for mobile devices
    scrollFixed: false,

    // the most recent filtered results
    filteredResults: [],

    // a list of ids of communities that are currently in-view
    visibleCommunityIds: [],

    // the id of the most recently-selected community
    selectedCommunityId: null,

    $list: null,
    $filters: null,
    $searchResults: null,

    initialize: function (options) {
      var defaults = {
        disabled_class: 'disabled',
        result_selected_class: 'selected',
        result_placeholder_class: 'search-result-vertical-placeholder',
        info_loading_class: 'loading',
        info_loaded_class: 'loaded'
      };
      this.options = $.extend(defaults, options);

      this.$list = this.$el.children('ul');

      this.filters = options.filters;
      this.filtersView = options.filtersView;
      this.mapView = options.mapView;

      // update our URL whenever the filters change
      this.listenTo(this.filters, 'change', this.render);
      this.listenTo(this.filtersView, 'headerclick', this.handleFiltersHeaderClick);

      // re-render whenever the collection changes
      this.listenTo(this.collection, 'change', this.render);
      this.listenTo(this.collection, 'reset', this.render);
      this.listenTo(this.collection, 'sync', this.render);

      // update the search results list when the map view changes
      this.listenTo(this.mapView, 'viewchange', this.handleMapViewChange);
      this.listenTo(this.mapView, 'markerclick', this.handleMapMarkerClick);
      this.listenTo(this.mapView, 'click', this.handleMapClick);

      // scroll event doesn't bubble, so bind directly to the element
      this.$list.on('scroll', _.bind(this.handleResultsScroll, this));
    },

    // render a community and return the rendered jQuery object
    renderCommunity: function (community) {
      var json = community.toJSON();

      // make 'kinds' into a list of display names, not enum values
      var kinds = _.values(community.get('kinds'));
      json.kinds = kinds;

      // add a pretty address string (in query format) for Google maps linking
      if (json.address) {
        json.address_query = encodeURIComponent(
          (json.address.line_1 || '') +

          (json.address.line_2 ? ' ' : '') +
          (json.address.line_2 || '') +

          ', ' +
          (json.address.city || '') +
          ' ' +

          (json.address.province || '') +
          ', ' +

          (json.address.postal || '')
        );
      }

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
      // fix full-screen scrolling problem for iOS devices
      if (!this.scrollFixed) {
        new ScrollFix(this.$list[0]);
        this.scrollFixed = true;
      }

      this.mapView.unHighlightMarkers();

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
      this.$list.children(':not([data-id="' + id + '"])').remove();

      // render an amount of communities necessary to force the list to scroll
      _.every(this.filteredResults, function (community) {
        // render the community if it's not the selected one, or if there is no
        // currently selected community, but there should be
        var $selectedCommunity = this.$list.children('[data-id="' + id + '"]');
        var selectedNotRendered = $selectedCommunity.length === 0 && id;
        if (community.get('id') !== id || selectedNotRendered) {
          var $community = this.renderCommunity(community);
          this.$list.append($community);
        }

        // return false if we're done, canceling iteration
        return this.$list[0].scrollHeight <= $(window).height();
      }, this);

      // fill the remaining vertical space with a placeholder element
      this.renderPlaceholder();

      // make sure the selected community is/stays selected
      this.$list.children('[data-id="' + id + '"]')
          .addClass(this.options.result_selected_class);

      return this;
    },

    // render more community results into the results list
    renderMoreResults: function (numberToRender) {
      numberToRender = numberToRender || 10;

      var index = this.$list.children('.community-search-result').length;
      var endIndex = Math.min(index + numberToRender,
          this.filteredResults.length);

      // render some more community results
      for (; index < endIndex; index++) {
        var community = this.filteredResults[index];
        var $community = this.renderCommunity(community);
        this.$list.append($community);
      }

      // fill the remaining space with the placeholder element
      this.renderPlaceholder();

      // we treat this as analogous to the user having scrolled the results,
      // since this won't be triggered unless that's the case. this is to
      // prevent firing off thousands of scroll events for what is essentially
      // one action.
      trackEvent('search-results', 'scroll', 'render-more-results');

      return this;
    },

    // render a vertical placeholder element into the results list to take up
    // vertical space and simulate a full list. helps preserve scroll momentum
    // on mobile devices.
    renderPlaceholder: function () {
      var $communities = this.$list.children('.community-search-result');
      var numRemaining = this.filteredResults.length - $communities.length;

      // get the current placeholder, or create one if one isn't present
      var $placeholder = this.$list.children(
          '.' + this.options.result_placeholder_class);
      if ($placeholder.length === 0) {
        $placeholder = $('<div></div>');
        $placeholder.addClass(this.options.result_placeholder_class);
        $placeholder.css('visibility', 'hidden');
      }

      // either update the placeholder's height to estimate remaining elements,
      // or remove it from the list entirely.
      if (numRemaining > 0) {
        var $community = $communities.first();
        var remainingHeight = $community.outerHeight() * 1.1 * numRemaining;
        $placeholder.css('height', Math.round(remainingHeight));

        // make sure the placeholder is always the last element in the list
        this.$list.append($placeholder);
      } else {
        // remove the placeholder if there are no more results to render
        $placeholder.remove();
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

    // toggle the display of the search results on or off
    toggle: function (enable) {
      this.$el.toggleClass(this.options.disabled_class, !enable);
      return this;
    },

    handleResultsScroll: function (e) {
      // get the placeholder element, if it exists
      var $placeholder = this.$list.children(
          '.' + this.options.result_placeholder_class);
      var placeholderHeight = $placeholder.outerHeight() || 0;

      // see if we're near the bottom
      var scrollHeight = this.$list[0].scrollHeight;
      var scrollBottom = this.$list.scrollTop() + this.$list.height();

      // if we're withing some margin of the bottom, render more communities
      if (scrollBottom >= scrollHeight - placeholderHeight - 400) {
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

      // zoom to the community's marker and highlight it once done
      this.mapView.showCommunity(communityId, function () {
        this.mapView.highlightMarker(communityId);
      }, this);

      trackEvent('search-results', 'click', 'result:' + communityId);

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
      this.mapView.highlightMarker(id);
      this.renderSearchResults();

      return this;
    },

    // un-highlight the selected result when the map is clicked
    handleMapClick: function (latlng) {
      this.selectedCommunityId = null;
      this.$list.children('.community-search-result')
          .removeClass(this.options.result_selected_class);
      return this;
    },

    // show the sign-up page in an iframe when the sign-up button is clicked
    handleSignUpClick: function (e) {
      e.preventDefault();
      e.stopPropagation();

      var $button = $(e.currentTarget);
      var $result = $button.parents('.community-search-result');
      var $longInfo = $result.find('.community-search-result-long-info');

      // mark the info as 'loading'
      $longInfo.addClass(this.options.info_loading_class);

      // add the frame to the info
      var url = $button.attr('href');
      var $frame = $(this.frameTemplate({ url: url }));
      $longInfo.append($frame);

      // whenever the frame loads, resize it to fit its content. we have to
      // attach the event handler directly since the 'load' event doesn't
      // bubble, and Backbone relies on that for its event binding.
      $frame.on('load', _.bind(this.handleFrameLoad, this));

      trackEvent('search-results', 'click', 'signup:' + $result.attr('data-id'));

      return this;
    },

    // open a popup for signup info on mobile when the button is clicked
    handleMobileSignUpClick: function (e) {
      e.preventDefault();

      var $button = $(e.currentTarget);
      var $result = $button.parents('.community-search-result');
      var $longInfo = $result.find('.community-search-result-long-info');

      // open a popup for the signup info
      var url = $button.attr('href');
      var popup = window.open(url, 'MC Sign-Up');

      trackEvent('search-results', 'click',
          'signup:mobile' + $result.attr('data-id'));

      return this;
    },

    // resize the iframe and focus its first input whenever it loads
    handleFrameLoad: function (e) {
      var $frame = $(e.currentTarget);
      var $result = $frame.parents('.community-search-result');
      var $longInfo = $result.find('.community-search-result-long-info');

      // adjust the frame's height to match its contents
      var $frameBody = $('body', $frame.contents());
      $frame.height($frameBody.height());

      // remove the 'loading' class from its parent and mark it as 'loaded'
      $longInfo.removeClass(this.options.info_loading_class);
      $longInfo.addClass(this.options.info_loaded_class);

      return this;
    },

    handleHeaderClick: function (e) {
      this.toggle(false);

      trackEvent('search-results', 'click', 'header');

      this.filtersView.toggle(true);
    },

    handleFiltersHeaderClick: function () {
      this.toggle(true);
      this.filtersView.toggle(false);
    }

  });

  var AppView = Backbone.View.extend({

    filters: new Filters(),
    map: new Map(),
    communities: new Communities(),

    mapView: null,
    filtersView: null,

    initialize: function (options) {
      var defaults = {};
      this.options = $.extend(defaults, options);

      this.filtersView = new FiltersView({
        el: $('#filters'),
        model: this.filters
      }).render();

      this.mapView = new MapView({
        el: $('#map'),
        model: this.map,
        communities: this.communities
      }).render();

      this.communitiesView = new CommunitiesView({
        el: $('#search-results'),

        mapView: this.mapView,
        filtersView: this.filtersView,

        filters: this.filters,
        collection: this.communities
      });

      // load initial community data from the server, updating the view
      this.communities.fetch();

      this.render();

      // track user device rotation
      $(window).on('orientationchange', this.handleOrientationChange);
    },

    render: function () {
      // hide the URL bar on iOS
      _.defer(function () { window.scrollTo(0, 1); });
    },

    // track when the user rotates their device
    handleOrientationChange: function (e) {
      trackEvent('map', 'rotate', 'orientation-change');
      return this;
    }

  });

  // start the app if we're on the map page
  if ($('#map').length > 0) {
    var app = new AppView();
  }

}());
