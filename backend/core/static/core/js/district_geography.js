(function ($) {
  $(function () {
    var country = $('#id_country');
    var zone = $('#id_zone');
    var region = $('#id_region');

    function endpoint() {
      return window.location.pathname.replace(/(add|change)\/?$/, 'geography/');
    }

    function populate(select, items, selectedValue) {
      var currentValue = selectedValue || select.val();
      select.empty().append('<option value="">---------</option>');
      $.each(items || [], function (_, item) {
        select.append($('<option>').attr('value', item.id).text(item.name));
      });
      if (currentValue && select.find('option[value="' + currentValue + '"]').length) {
        select.val(currentValue);
      }
    }

    function loadZones() {
      populate(zone, []);
      populate(region, []);
      $.getJSON(endpoint(), { country_id: country.val() }, function (response) {
        populate(zone, response.zones);
      });
    }

    function loadRegions() {
      populate(region, []);
      $.getJSON(endpoint(), {
        country_id: country.val(),
        zone_id: zone.val()
      }, function (response) {
        populate(region, response.regions);
      });
    }

    country.on('change', loadZones);
    zone.on('change', loadRegions);

    if (country.val()) {
      var selectedZone = zone.val();
      var selectedRegion = region.val();
      $.getJSON(endpoint(), {
        country_id: country.val(),
        zone_id: selectedZone
      }, function (response) {
        populate(zone, response.zones, selectedZone);
        populate(region, response.regions, selectedRegion);
      });
    }
  });
})(django.jQuery);