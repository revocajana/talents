import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as apiService from '../services/apiService';
import '../styles/login.css';

const initialForm = {
  name: '',
  registry_number: '',
  ownership_type: '',
  country: '',
  zone: '',
  region: '',
  district: '',
  ward: '',
  phone: '',
  physical_address: '',
  email: '',
};

const list = (response) => response?.data?.results || [];

export default function SchoolRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]);
  const [zones, setZones] = useState([]);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [ownershipOptions, setOwnershipOptions] = useState([]);
  const [schoolsError, setSchoolsError] = useState('');

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const [countriesResponse, ownershipResponse] = await Promise.all([
          apiService.getAllCountries(),
          apiService.getSchoolOwnershipTypes(),
        ]);
        const countryList = list(countriesResponse);
        setCountries(countryList);
        setOwnershipOptions(ownershipResponse.data.results || ownershipResponse.data || []);
        const tanzania = countryList.find((country) => country.name.toLowerCase() === 'tanzania' || country.code.toLowerCase() === 'tza');
        if (tanzania) setForm((current) => ({ ...current, country: String(tanzania.id) }));
      } catch (err) {
        setError(err.response?.data?.detail || 'Unable to load location options. Please check your network connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    loadLocations();
  }, []);

  useEffect(() => {
    if (!form.country) return;
    apiService.getAllZones({ country: form.country })
      .then((response) => setZones(list(response)))
      .catch(() => setError('Unable to load location options. Please check your network connection and try again.'));
  }, [form.country]);

  useEffect(() => {
    if (!form.zone) return;
    apiService.getAllRegions({ zone: form.zone })
      .then((response) => setRegions(list(response)))
      .catch(() => setError('Unable to load location options. Please check your network connection and try again.'));
  }, [form.zone]);

  useEffect(() => {
    if (!form.region) return;
    apiService.getAllDistricts({ region: form.region })
      .then((response) => setDistricts(list(response)))
      .catch(() => setError('Unable to load location options. Please check your network connection and try again.'));
  }, [form.region]);

  useEffect(() => {
    if (!form.district) return;
    apiService.getAllWards({ district: form.district })
      .then((response) => setWards(list(response)))
      .catch(() => setError('Unable to load location options. Please check your network connection and try again.'));
  }, [form.district]);

  const countryZones = zones.filter((zone) => Number(zone.country) === Number(form.country));
  const zoneRegions = regions.filter((region) => Number(region.zone) === Number(form.zone));
  const regionDistricts = districts.filter((district) => Number(district.region) === Number(form.region));
  const districtWards = wards.filter((ward) => Number(ward.district) === Number(form.district));

  const updateField = (event) => {
    const { name, value } = event.target;
    const cleared = {
      country: { zone: '', region: '', district: '', ward: '' },
      zone: { region: '', district: '', ward: '' },
      region: { district: '', ward: '' },
      district: { ward: '' },
    }[name] || {};
    setForm({ ...form, [name]: value, ...cleared });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setSchoolsError('');
      await apiService.createSchool({
        name: form.name,
        registry_number: form.registry_number,
        ownership_type: form.ownership_type,
        country: Number(form.country),
        zone: Number(form.zone),
        region: Number(form.region),
        district: Number(form.district),
        ward: Number(form.ward),
        phone: form.phone,
        physical_address: form.physical_address,
        email: form.email,
      });
      setSubmitted(true);
    } catch (err) {
      const details = err.response?.data;
      setSchoolsError(details?.detail || Object.values(details || {}).flat().join(' ') || 'School registration failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page registration-page">
      <div className="registration-card">
        <div className="login-header">
          <p className="welcome-label">Talanta Management System</p>
          <h2>Register school</h2>
        </div>

        {error && <div className="alert error">{error}</div>}

        {submitted ? (
          <div className="registration-success">
            <h3>Registration request received</h3>
            <p>Your school details have been recorded for review.</p>
            <button type="button" className="primary-btn" onClick={() => navigate('/login')}>Return to login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="registration-form">
            {loading ? <p>Loading locations...</p> : null}
            <div className="registration-grid">
              <label>School name<input name="name" value={form.name} onChange={updateField} placeholder="e.g. Sengerema Secondary School" required /></label>
              <label>Registry number<input name="registry_number" value={form.registry_number} onChange={updateField} placeholder="e.g. S2047" required /></label>
              <label>Ownership type<select name="ownership_type" value={form.ownership_type} onChange={updateField} required disabled={loading || !ownershipOptions.length}><option value="">Select ownership type</option>{ownershipOptions.map((option) => <option key={option.id} value={option.name}>{option.name}</option>)}</select></label>
              <label>Country<select name="country" value={form.country} onChange={updateField} required disabled={loading}><option value="">Select country</option>{countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}</select></label>
              <label>Zone<select name="zone" value={form.zone} onChange={updateField} required disabled={loading || !form.country}><option value="">Select zone</option>{countryZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
              <label>Region<select name="region" value={form.region} onChange={updateField} required disabled={!form.zone}><option value="">Select region</option>{zoneRegions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></label>
              <label>District<select name="district" value={form.district} onChange={updateField} required disabled={!form.region}><option value="">Select district</option>{regionDistricts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}</select></label>
              <label>Ward<select name="ward" value={form.ward} onChange={updateField} required disabled={!form.district}><option value="">Select ward</option>{districtWards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}</select></label>
              <label>School phone<input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="e.g. +255 712 345 678" required /></label>
              <label>Physical address<input name="physical_address" type="text" value={form.physical_address} onChange={updateField} placeholder="P.O.Box 278 Sengerema" /></label>
              <label>School email<input name="email" type="email" value={form.email} onChange={updateField} placeholder="e.g. school@example.com" required /></label>
            </div>
            {schoolsError && <div className="alert error">{schoolsError}</div>}
            <div className="registration-actions">
              <button type="button" className="secondary-btn" onClick={() => navigate('/login')}>Back</button>
              <button type="submit" className="primary-btn" disabled={loading || saving}>{saving ? 'Saving...' : 'Register school'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
