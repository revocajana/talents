(function ($) {
  'use strict';

  function fieldRow(fieldName) {
    return $('#id_' + fieldName).closest('.form-row');
  }

  function showRows(fields) {
    fields.forEach(function (fieldName) {
      var row = fieldRow(fieldName);
      if (row.length) {
        row.show();
      }
    });
  }

  function hideRows(fields) {
    fields.forEach(function (fieldName) {
      var row = fieldRow(fieldName);
      if (row.length) {
        row.hide();
      }
    });
  }

  var optionCache = {};

  function getOptions(fieldName) {
    var field = $('#id_' + fieldName);
    if (!field.length) {
      return [];
    }
    if (!optionCache[fieldName]) {
      optionCache[fieldName] = field.find('option').map(function () {
        var option = $(this);
        return { value: option.val(), text: option.text() };
      }).get();
    }
    return optionCache[fieldName];
  }

  function filterByParent(fieldName, parentFieldName, constrainedRoles) {
    var field = $('#id_' + fieldName);
    if (!field.length) {
      return;
    }

    var role = $('#id_role').val();
    var isConstrained = constrainedRoles.indexOf(role) !== -1;
    var parentValue = $('#' + parentFieldName).val();
    var parentMap = JSON.parse(field.attr('data-parent-map') || '{}');
    var countryValue = $('#id_country').val();
    var countryMap = JSON.parse(field.attr('data-country-map') || '{}');
    var managedMap = JSON.parse(field.attr('data-managed-map') || '{}');
    var currentValue = field.val();
    var options = getOptions(fieldName);

    field.empty();
    options.forEach(function (option) {
      var matchesLocation = !option.value || !isConstrained || (parentValue
        ? String(parentMap[option.value]) === String(parentValue)
        : !countryValue || !countryMap[option.value] || String(countryMap[option.value]) === String(countryValue));
      var managerIsAvailable = !option.value || !isConstrained || !(managedMap[option.value] || []).includes(role);

      if (matchesLocation && managerIsAvailable) {
        field.append($('<option>', { value: option.value, text: option.text }));
      }
    });

    if (currentValue && field.find('option[value="' + currentValue + '"]').length) {
      field.val(currentValue);
    }
  }

  function updateLocationOptions() {
    var constrainedRoles = ['zone_manager', 'region_manager', 'district_manager', 'ward_manager', 'head_teacher', 'sport_teacher'];
    filterByParent('zone', 'country', constrainedRoles);
    filterByParent('region', 'zone', constrainedRoles);
    filterByParent('district', 'region', constrainedRoles);
    filterByParent('ward', 'district', constrainedRoles);
    filterByParent('school', 'country', constrainedRoles);
  }

  function updateScopeFields() {
    var role = $('#id_role').val();
    var visibleFields = {
      talent_admin: ['country'],
      zone_manager: ['country', 'zone'],
      region_manager: ['country', 'zone', 'region'],
      district_manager: ['country', 'zone', 'region', 'district'],
      ward_manager: ['country', 'zone', 'region', 'district', 'ward'],
      head_teacher: ['country', 'school'],
      sport_teacher: ['country', 'school'],
      student: ['country', 'school'],
      parent: []
    }[role] || [];

    var allFields = ['country', 'zone', 'region', 'district', 'ward', 'school'];
    showRows(visibleFields);
    hideRows(allFields.filter(function (fieldName) {
      return visibleFields.indexOf(fieldName) === -1;
    }));

    updateLocationOptions();
  }

  $(function () {
    $('#id_role').on('change', function () {
      var role = $('#id_role').val();
      if (role === 'zone_manager') {
        $('#id_region, #id_district, #id_ward, #id_school').val('');
      } else if (role === 'region_manager') {
        $('#id_district, #id_ward, #id_school').val('');
      } else if (role === 'district_manager') {
        $('#id_ward, #id_school').val('');
      } else if (role === 'ward_manager') {
        $('#id_school').val('');
      } else if (role === 'head_teacher' || role === 'sport_teacher' || role === 'student') {
        $('#id_zone, #id_region, #id_district, #id_ward').val('');
      }
      updateScopeFields();
    });

    $('#id_country').on('change', function () {
      $('#id_zone, #id_region, #id_district, #id_ward, #id_school').val('');
      updateLocationOptions();
    });
    $('#id_zone').on('change', function () {
      $('#id_region, #id_district, #id_ward').val('');
      updateLocationOptions();
    });
    $('#id_region').on('change', function () {
      $('#id_district, #id_ward').val('');
      updateLocationOptions();
    });
    $('#id_district').on('change', function () {
      $('#id_ward').val('');
      updateLocationOptions();
    });
    updateScopeFields();
  });
})(django.jQuery);
