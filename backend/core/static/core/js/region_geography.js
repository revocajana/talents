(function ($) {
  $(function () {
    var country = $('#id_country');
    var zone = $('#id_zone');

    function endpoint() {
      return window.location.pathname.replace(/(add|change)\/?$/, 'geography/');
    }

    function populate(items, selectedValue) {
      var currentValue = selectedValue || zone.val();
      zone.empty().append('<option value="">---------</option>');
      $.each(items || [], function (_, item) {
        zone.append($('<option>').attr('value', item.id).text(item.name));
      });
      if (currentValue && zone.find('option[value="' + currentValue + '"]').length) {
        zone.val(currentValue);
      }
    }

    function loadZones() {
      populate([]);
      $.getJSON(endpoint(), { country_id: country.val() }, function (response) {
        populate(response.zones);
      });
    }

    country.on('change', function () {
      zone.val('');
      loadZones();
    });

    if (country.val()) {
      var selectedZone = zone.val();
      $.getJSON(endpoint(), { country_id: country.val() }, function (response) {
        populate(response.zones, selectedZone);
      });
    }
  });
})(django.jQuery);