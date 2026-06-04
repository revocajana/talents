(function ($) {
  $(function () {
    var countrySelect = $('#id_country');
    var zoneSelect = $('#id_zone');
    var regionSelect = $('#id_region');
    var districtSelect = $('#id_district');
    var wardSelect = $('#id_ward');

    function adminEndpoint() {
      return window.location.pathname.replace(/(add|change)\/?$/, 'geography/');
    }

    function populateSelect(selectEl, items, selectedId) {
      if (!selectEl.length) {
        return;
      }
      var currentValue = selectEl.val();
      selectEl.empty().append('<option value="">---------</option>');

      $.each(items || [], function (_, item) {
        selectEl.append($('<option>').attr('value', item.id).text(item.name));
      });

      if (selectedId) {
        selectEl.val(selectedId);
      } else if (currentValue && selectEl.find('option[value="' + currentValue + '"]').length) {
        selectEl.val(currentValue);
      }
    }

    function fetchGeography(params, callback) {
      $.getJSON(adminEndpoint(), params, callback);
    }

    function setRelationshipValues(related) {
      if (!related) {
        return;
      }
      if (related.country_id) {
        countrySelect.val(related.country_id);
      }
      if (related.zone_id) {
        zoneSelect.val(related.zone_id);
      }
      if (related.region_id) {
        regionSelect.val(related.region_id);
      }
      if (related.district_id) {
        districtSelect.val(related.district_id);
      }
      if (related.ward_id) {
        wardSelect.val(related.ward_id);
      }
    }

    function refreshCountry() {
      fetchGeography({ country_id: countrySelect.val() }, function (response) {
        populateSelect(zoneSelect, response.zones);
        populateSelect(regionSelect, response.regions);
        populateSelect(districtSelect, response.districts);
        populateSelect(wardSelect, response.wards);
      });
    }

    function refreshZone() {
      fetchGeography({ country_id: countrySelect.val(), zone_id: zoneSelect.val() }, function (response) {
        if (response.related) {
          setRelationshipValues(response.related);
        }
        populateSelect(regionSelect, response.regions, response.related ? response.related.region_id : null);
        populateSelect(districtSelect, response.districts);
        populateSelect(wardSelect, response.wards);
      });
    }

    function refreshRegion() {
      fetchGeography({ country_id: countrySelect.val(), zone_id: zoneSelect.val(), region_id: regionSelect.val() }, function (response) {
        if (response.related) {
          setRelationshipValues(response.related);
        }
        populateSelect(districtSelect, response.districts, response.related ? response.related.district_id : null);
        populateSelect(wardSelect, response.wards);
      });
    }

    function refreshDistrict() {
      fetchGeography({
        country_id: countrySelect.val(),
        zone_id: zoneSelect.val(),
        region_id: regionSelect.val(),
        district_id: districtSelect.val(),
      }, function (response) {
        if (response.related) {
          setRelationshipValues(response.related);
        }
        populateSelect(wardSelect, response.wards, response.related ? response.related.ward_id : null);
      });
    }

    function refreshWard() {
      fetchGeography({ ward_id: wardSelect.val() }, function (response) {
        if (response.related) {
          setRelationshipValues(response.related);
        }
        populateSelect(zoneSelect, response.zones, response.related ? response.related.zone_id : null);
        populateSelect(regionSelect, response.regions, response.related ? response.related.region_id : null);
        populateSelect(districtSelect, response.districts, response.related ? response.related.district_id : null);
        populateSelect(wardSelect, response.wards, response.related ? response.related.ward_id : null);
      });
    }

    countrySelect.on('change', refreshCountry);
    zoneSelect.on('change', refreshZone);
    regionSelect.on('change', refreshRegion);
    districtSelect.on('change', refreshDistrict);
    wardSelect.on('change', refreshWard);

    if (countrySelect.val()) {
      refreshCountry();
    } else if (zoneSelect.val()) {
      refreshZone();
    } else if (regionSelect.val()) {
      refreshRegion();
    } else if (districtSelect.val()) {
      refreshDistrict();
    } else if (wardSelect.val()) {
      refreshWard();
    }
  });
})(django.jQuery);
