(function ($) {
  'use strict';

  var optionCache = {};

  function fieldRow(fieldName) {
    return $('#id_' + fieldName).closest('.form-row');
  }

  function getOptions(fieldName) {
    var field = $('#id_' + fieldName);
    if (!field.length) {
      return [];
    }
    if (!optionCache[fieldName]) {
      var allOptions = field.attr('data-all-options');
      optionCache[fieldName] = allOptions
        ? JSON.parse(allOptions)
        : field.find('option').map(function () {
          return { value: $(this).val(), text: $(this).text() };
        }).get();
    }
    return optionCache[fieldName];
  }

  function filterField(fieldName, parentFieldName, constrainedRoles) {
    var field = $('#id_' + fieldName);
    if (!field.length) {
      return;
    }

    var role = $('#id_role').val();
    var constrained = constrainedRoles.indexOf(role) !== -1;
    var countryValue = $('#id_country').val();
    var parentValue = $('#' + parentFieldName).val();
    var parentMap = JSON.parse(field.attr('data-parent-map') || '{}');
    var countryMap = JSON.parse(field.attr('data-country-map') || '{}');
    var managedMap = JSON.parse(field.attr('data-managed-map') || '{}');
    var currentValue = field.val();

    field.empty();
    getOptions(fieldName).forEach(function (option) {
      var locationMatches = !option.value || !constrained || (parentValue
        ? String(parentMap[option.value]) === String(parentValue)
        : !countryValue || String(countryMap[option.value]) === String(countryValue));
      var roleAssignmentAvailable = !option.value || !constrained || !(managedMap[option.value] || []).includes(role);

      if (locationMatches && roleAssignmentAvailable) {
        field.append($('<option>', { value: option.value, text: option.text }));
      }
    });

    if (currentValue && field.find('option[value="' + currentValue + '"]').length) {
      field.val(currentValue);
    }
  }

  function updateLocations() {
    var constrainedRoles = ['zone_manager', 'region_manager', 'district_manager', 'ward_manager', 'head_teacher', 'sport_teacher'];
    filterField('zone', 'country', constrainedRoles);
    filterField('region', 'zone', constrainedRoles);
    filterField('district', 'region', constrainedRoles);
    filterField('ward', 'district', constrainedRoles);
    filterField('school', 'ward', constrainedRoles);
  }

  function updateScopeFields() {
    var role = $('#id_role').val();
    var visibleFields = {
      talent_admin: ['country'],
      zone_manager: ['country', 'zone'],
      region_manager: ['country', 'zone', 'region'],
      district_manager: ['country', 'zone', 'region', 'district'],
      ward_manager: ['country', 'zone', 'region', 'district', 'ward'],
      head_teacher: ['country', 'zone', 'region', 'district', 'ward', 'school'],
      sport_teacher: ['country', 'zone', 'region', 'district', 'ward', 'school'],
      student: ['school'],
      parent: []
    }[role] || [];
    var allFields = ['country', 'zone', 'region', 'district', 'ward', 'school'];

    allFields.forEach(function (fieldName) {
      var row = fieldRow(fieldName);
      if (visibleFields.indexOf(fieldName) === -1) {
        row.hide();
      } else {
        row.show();
      }
    });
    updateLocations();
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
      } else if (role === 'head_teacher' || role === 'sport_teacher') {
        $('#id_zone, #id_region, #id_district, #id_ward').val('');
      } else if (role === 'student') {
        $('#id_country, #id_zone, #id_region, #id_district, #id_ward').val('');
      }
      updateScopeFields();
    });

    $('#id_country').on('change', function () {
      $('#id_zone, #id_region, #id_district, #id_ward, #id_school').val('');
      updateLocations();
    });
    $('#id_zone').on('change', function () {
      $('#id_region, #id_district, #id_ward').val('');
      updateLocations();
    });
    $('#id_region').on('change', function () {
      $('#id_district, #id_ward').val('');
      updateLocations();
    });
    $('#id_district').on('change', function () {
      $('#id_ward').val('');
      updateLocations();
    });
    updateScopeFields();
  });
})(django.jQuery);
