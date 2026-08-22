(function ($) {
  $(function () {
    var fields = {
      country: $('#id_country'),
      zone: $('#id_zone'),
      region: $('#id_region'),
      district: $('#id_district'),
      ward: $('#id_ward'),
      school: $('#id_school')
    };

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

    function refresh(params, level) {
      if (level === 'country') {
        populate(fields.zone, []);
      }
      if (level === 'country' || level === 'zone') {
        populate(fields.region, []);
      }
      if (level === 'country' || level === 'zone' || level === 'region') {
        populate(fields.district, []);
      }
      if (level !== 'ward') {
        populate(fields.ward, []);
      }
      populate(fields.school, []);

      $.getJSON(endpoint(), params, function (response) {
        if (level === 'country') {
          populate(fields.zone, response.zones);
        }
        if (level === 'country' || level === 'zone') {
          populate(fields.region, response.regions);
        }
        if (level === 'country' || level === 'zone' || level === 'region') {
          populate(fields.district, response.districts);
        }
        if (level !== 'ward') {
          populate(fields.ward, response.wards);
        }
        populate(fields.school, response.schools);
      });
    }

    fields.country.on('change', function () {
      fields.zone.val('');
      fields.region.val('');
      fields.district.val('');
      fields.ward.val('');
      fields.school.val('');
      refresh({ country_id: fields.country.val() }, 'country');
    });

    fields.zone.on('change', function () {
      fields.region.val('');
      fields.district.val('');
      fields.ward.val('');
      fields.school.val('');
      refresh({ country_id: fields.country.val(), zone_id: fields.zone.val() }, 'zone');
    });

    fields.region.on('change', function () {
      fields.district.val('');
      fields.ward.val('');
      fields.school.val('');
      refresh({ region_id: fields.region.val() }, 'region');
    });

    fields.district.on('change', function () {
      fields.ward.val('');
      fields.school.val('');
      refresh({ district_id: fields.district.val() }, 'district');
    });

    fields.ward.on('change', function () {
      fields.school.val('');
      refresh({ ward_id: fields.ward.val() }, 'ward');
    });

    if (fields.country.val()) {
      refresh({
        country_id: fields.country.val(),
        zone_id: fields.zone.val(),
        region_id: fields.region.val(),
        district_id: fields.district.val(),
        ward_id: fields.ward.val()
      }, 'country');
    }
  });
})(django.jQuery);