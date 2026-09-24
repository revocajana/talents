(function () {
  'use strict';

  function loadDistrictCompetitions(districtSelect, competitionSelect) {
    competitionSelect.innerHTML = '<option value="">---------</option>';
    if (!districtSelect.value) {
      competitionSelect.disabled = true;
      return;
    }

    var url = window.location.pathname.replace(/(?:add|\d+\/change)\/?$/, 'district-competitions/');
    url += '?district_id=' + encodeURIComponent(districtSelect.value);
    competitionSelect.disabled = true;

    fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        (data.results || []).forEach(function (competition) {
          var option = document.createElement('option');
          option.value = competition.id;
          option.textContent = competition.name;
          competitionSelect.appendChild(option);
        });
        competitionSelect.disabled = false;
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var districtSelect = document.getElementById('id_district');
    var competitionSelect = document.getElementById('id_competition');
    if (!districtSelect || !competitionSelect) return;

    districtSelect.addEventListener('change', function () {
      loadDistrictCompetitions(districtSelect, competitionSelect);
    });
    competitionSelect.disabled = !districtSelect.value;
  });
}());
