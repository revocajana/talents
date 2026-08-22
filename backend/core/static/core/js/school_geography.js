(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var countrySelect = document.getElementById('id_country');
    var zoneSelect = document.getElementById('id_zone');
    var regionSelect = document.getElementById('id_region');
    var districtSelect = document.getElementById('id_district');
    var wardSelect = document.getElementById('id_ward');

    if (!countrySelect || !zoneSelect || !regionSelect || !districtSelect || !wardSelect) {
      return;
    }

    function adminEndpoint() {
      return window.location.pathname.replace(/\/(?:add|change)\/?$/, '/geography/');
    }

    function populateSelect(selectEl, items, selectedId) {
      var currentValue = selectedId || selectEl.value;
      selectEl.replaceChildren(new Option('---------', ''));
      (items || []).forEach(function (item) {
        selectEl.add(new Option(item.name, item.id));
      });
      if (currentValue && Array.from(selectEl.options).some(function (option) {
        return option.value === String(currentValue);
      })) {
        selectEl.value = currentValue;
      }
    }

    function loadGeography(params, preserve) {
      var query = new URLSearchParams(params);
      return fetch(adminEndpoint() + '?' + query.toString(), {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      }).then(function (response) {
        if (!response.ok) {
          throw new Error('Geography request failed with status ' + response.status);
        }
        return response.json();
      }).then(function (data) {
        populateSelect(zoneSelect, data.zones, preserve && preserve.zone);
        populateSelect(regionSelect, data.regions, preserve && preserve.region);
        populateSelect(districtSelect, data.districts, preserve && preserve.district);
        populateSelect(wardSelect, data.wards, preserve && preserve.ward);
      }).catch(function (error) {
        console.error('Unable to load school geography options.', error);
      });
    }

    function clearBelow(select) {
      var levels = [zoneSelect, regionSelect, districtSelect, wardSelect];
      levels.slice(levels.indexOf(select)).forEach(function (field) {
        populateSelect(field, []);
      });
    }

    countrySelect.addEventListener('change', function () {
      clearBelow(zoneSelect);
      loadGeography({ country_id: countrySelect.value });
    });
    zoneSelect.addEventListener('change', function () {
      clearBelow(regionSelect);
      loadGeography({ country_id: countrySelect.value, zone_id: zoneSelect.value });
    });
    regionSelect.addEventListener('change', function () {
      clearBelow(districtSelect);
      loadGeography({ country_id: countrySelect.value, zone_id: zoneSelect.value, region_id: regionSelect.value });
    });
    districtSelect.addEventListener('change', function () {
      clearBelow(wardSelect);
      loadGeography({ country_id: countrySelect.value, zone_id: zoneSelect.value, region_id: regionSelect.value, district_id: districtSelect.value });
    });
    wardSelect.addEventListener('change', function () {
      loadGeography({ country_id: countrySelect.value, zone_id: zoneSelect.value, region_id: regionSelect.value, district_id: districtSelect.value, ward_id: wardSelect.value });
    });

    if (countrySelect.value) {
      loadGeography({
        country_id: countrySelect.value,
        zone_id: zoneSelect.value,
        region_id: regionSelect.value,
        district_id: districtSelect.value,
        ward_id: wardSelect.value
      }, {
        zone: zoneSelect.value,
        region: regionSelect.value,
        district: districtSelect.value,
        ward: wardSelect.value
      });
    }
  });
}());
