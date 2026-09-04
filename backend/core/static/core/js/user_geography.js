(function ($) {
  'use strict';

  var fields = ['country', 'zone', 'region', 'district', 'ward', 'school'];
  var parentFields = {
    zone: 'country',
    region: 'zone',
    district: 'region',
    ward: 'district',
    school: 'ward'
  };
  var optionCache = {};

  function getField(name) {
    return $('#id_' + name);
  }

  function getOptions(name) {
    if (optionCache[name]) {
      return optionCache[name];
    }

    var field = getField(name);
    var encodedOptions = field.attr('data-all-options');
    var options = encodedOptions
      ? JSON.parse(encodedOptions)
      : field.find('option').map(function () {
          return { value: $(this).val(), text: $(this).text() };
        }).get();

    if (!options.some(function (option) { return option.value === ''; })) {
      options.unshift({ value: '', text: '---------' });
    }
    optionCache[name] = options;
    return options;
  }

  function readMap(field, name) {
    try {
      return JSON.parse(field.attr(name) || '{}');
    } catch (error) {
      return {};
    }
  }

  function optionMatchesCountry(option, countryId, countryMap) {
    return !countryId || !option.value || String(countryMap[String(option.value)]) === String(countryId);
  }

  function filterField(name) {
    var field = getField(name);
    if (!field.length) {
      return;
    }

    var parent = getField(parentFields[name]);
    var parentId = parent.length ? parent.val() : '';
    var countryId = getField('country').val();
    var parentMap = readMap(field, 'data-parent-map');
    var countryMap = readMap(field, 'data-country-map');
    var currentValue = field.val();

    field.empty();
    getOptions(name).forEach(function (option) {
      var matchesParent = !option.value || !parentId || String(parentMap[String(option.value)]) === String(parentId);
      var matchesCountry = !option.value || optionMatchesCountry(option, countryId, countryMap);
      if (matchesParent && matchesCountry) {
        field.append($('<option>', { value: option.value, text: option.text }));
      }
    });

    if (currentValue && field.find('option[value="' + currentValue + '"]').length) {
      field.val(currentValue);
    } else if (!currentValue) {
      field.val('');
    }
  }

  function refreshLocations() {
    fields.slice(1).forEach(filterField);
  }

  $(function () {
    fields.forEach(function (name) {
      getField(name).on('change', function () {
        if (name === 'country') {
          ['zone', 'region', 'district', 'ward', 'school'].forEach(function (child) {
            getField(child).val('');
          });
        } else if (name === 'zone') {
          ['region', 'district', 'ward', 'school'].forEach(function (child) {
            getField(child).val('');
          });
        } else if (name === 'region') {
          ['district', 'ward', 'school'].forEach(function (child) {
            getField(child).val('');
          });
        } else if (name === 'district') {
          ['ward', 'school'].forEach(function (child) {
            getField(child).val('');
          });
        } else if (name === 'ward') {
          getField('school').val('');
        }
        refreshLocations();
      });
    });

    refreshLocations();
  });
})(django.jQuery);
