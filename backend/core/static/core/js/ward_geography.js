(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var country = document.getElementById('id_country');
    var zone = document.getElementById('id_zone');
    var region = document.getElementById('id_region');
    var district = document.getElementById('id_district');

    if (!country || !zone || !region || !district) {
      return;
    }

    function endpoint() {
      return window.location.pathname.replace(/\/(?:add|change)\/?$/, '/geography/');
    }

    function populate(select, items, selectedValue) {
      var currentValue = selectedValue || select.value;
      select.replaceChildren(new Option('---------', ''));
      (items || []).forEach(function (item) {
        select.add(new Option(item.name, item.id));
      });
      if (currentValue && Array.from(select.options).some(function (option) {
        return option.value === String(currentValue);
      })) {
        select.value = currentValue;
      }
    }

    function load(params, preserve) {
      var query = new URLSearchParams(params);
      fetch(endpoint() + '?' + query.toString(), {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      }).then(function (response) {
        if (!response.ok) {
          throw new Error('Geography request failed with status ' + response.status);
        }
        return response.json();
      }).then(function (data) {
        populate(zone, data.zones, preserve && preserve.zone);
        populate(region, data.regions, preserve && preserve.region);
        populate(district, data.districts, preserve && preserve.district);
      }).catch(function (error) {
        console.error('Unable to load ward geography options.', error);
      });
    }

    country.addEventListener('change', function () {
      populate(zone, []);
      populate(region, []);
      populate(district, []);
      load({ country_id: country.value });
    });

    zone.addEventListener('change', function () {
      populate(region, []);
      populate(district, []);
      load({ country_id: country.value, zone_id: zone.value });
    });

    region.addEventListener('change', function () {
      populate(district, []);
      load({ country_id: country.value, zone_id: zone.value, region_id: region.value });
    });

    if (country.value) {
      load({
        country_id: country.value,
        zone_id: zone.value,
        region_id: region.value
      }, {
        zone: zone.value,
        region: region.value,
        district: district.value
      });
    }
  });
}());