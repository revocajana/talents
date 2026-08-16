import { useState } from 'react';
import { Header } from '../components/shared';
import '../styles/dashboard.css';
import '../styles/talentadmin.css';

export default function TalentAdminPage() {
  const [formData, setFormData] = useState({
    talentName: '',
    category: '',
    description: '',
  });

  const [talentsData, setTalentsData] = useState([
    { id: 1, talent: 'Music', category: 'Arts', students: 145, competitions: 8 },
    { id: 2, talent: 'Football', category: 'Sports', students: 320, competitions: 12 },
    { id: 3, talent: 'Tech Club', category: 'Technology', students: 87, competitions: 5 },
    { id: 4, talent: 'Debate', category: 'Academics', students: 92, competitions: 6 },
  ]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTalent = () => {
    if (formData.talentName && formData.category) {
      const newTalent = {
        id: talentsData.length + 1,
        talent: formData.talentName,
        category: formData.category,
        students: 0,
        competitions: 0,
      };
      setTalentsData([...talentsData, newTalent]);
      setFormData({ talentName: '', category: '', description: '' });
    }
  };

  const statsData = [
    { label: 'Total Schools', value: '145' },
    { label: 'Total Students', value: '8,234' },
    { label: 'Active Competitions', value: '23' },
    { label: 'Registered Talents', value: talentsData.length.toString() },
  ];

  const competitionsData = [
    { id: 1, name: 'National Sports Day', type: 'Zone', schools: 24, participants: 450 },
    { id: 2, name: 'Tech Innovation', type: 'Regional', schools: 15, participants: 120 },
    { id: 3, name: 'Music Festival', type: 'District', schools: 8, participants: 200 },
  ];

  const usersData = [
    { id: 1, name: 'John Mwase', role: 'Region Manager', region: 'Lake Zone', status: 'Active' },
    { id: 2, name: 'Grace Kamau', role: 'Zone Manager', region: 'Lake Zone', status: 'Active' },
    { id: 3, name: 'Peter Kitui', role: 'District Manager', region: 'Sengerema', status: 'Active' },
    { id: 4, name: 'Mary Kipchoge', role: 'Head Teacher', region: 'Busisi Secondary', status: 'Active' },
  ];

  return (
    <div className="page-container">
      <Header title="Talent Management" />
      <main className="admin-content">
        <div className="cards-container">
          {/* Summary Statistics Card */}
          <section className="admin-section">
            <div className="section-header">
              <h2>Overview</h2>
              <p>Dashboard statistics</p>
            </div>
            <div className="stats-overview">
              {statsData.map((stat, idx) => (
                <div key={idx} className="stat-card">
                  <p className="stat-label">{stat.label}</p>
                  <h3 className="stat-value">{stat.value}</h3>
                </div>
              ))}
            </div>
          </section>

          {/* Talents Management Card */}
          <section className="admin-section" id="talents">
            <div className="section-header">
              <h2>Talents Management</h2>
              <p>Add and manage talents</p>
            </div>
            <div className="form-container">
              <h3>Add New Talent</h3>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Talent Name"
                  name="talentName"
                  value={formData.talentName}
                  onChange={handleFormChange}
                  className="form-input"
                />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="form-input"
                >
                  <option value="">Select Category</option>
                  <option value="Sports">Sports</option>
                  <option value="Arts">Arts</option>
                  <option value="Technology">Technology</option>
                  <option value="Academics">Academics</option>
                  <option value="Music">Music</option>
                </select>
                <textarea
                  placeholder="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="form-input"
                ></textarea>
                <button onClick={handleAddTalent} className="btn-primary" style={{ gridColumn: '1 / -1' }}>Add Talent</button>
              </div>
            </div>
          </section>

          {/* Registered Talents Card */}
          <section className="admin-section" id="talents-list">
            <div className="section-header">
              <h2>Registered Talents</h2>
              <p>{talentsData.length} talents registered</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Talent Name</th>
                    <th>Category</th>
                    <th>Students</th>
                    <th>Competitions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {talentsData.map((talent) => (
                    <tr key={talent.id}>
                      <td>{talent.talent}</td>
                      <td>{talent.category}</td>
                      <td>{talent.students}</td>
                      <td>{talent.competitions}</td>
                      <td><button className="btn-action">Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Competitions Card */}
          <section className="admin-section" id="competitions">
            <div className="section-header">
              <h2>Competitions</h2>
              <p>Active competitions</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Competition Name</th>
                    <th>Type</th>
                    <th>Schools</th>
                    <th>Participants</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {competitionsData.map((comp) => (
                    <tr key={comp.id}>
                      <td>{comp.name}</td>
                      <td><span className="badge">{comp.type}</span></td>
                      <td>{comp.schools}</td>
                      <td>{comp.participants}</td>
                      <td><button className="btn-action">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Users & Staff Card */}
          <section className="admin-section" id="users">
            <div className="section-header">
              <h2>Users & Staff</h2>
              <p>{usersData.length} users</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Assignment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.role}</td>
                      <td>{user.region}</td>
                      <td><span className="status-badge active">{user.status}</span></td>
                      <td><button className="btn-action">Manage</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* System Reports Card */}
          <section className="admin-section" id="reports">
            <div className="section-header">
              <h2>System Reports</h2>
              <p>Analytics and insights</p>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Users by Role</h4>
                <ul className="report-list">
                  <li><span>Region Managers:</span> 5</li>
                  <li><span>Zone Managers:</span> 8</li>
                  <li><span>District Managers:</span> 24</li>
                  <li><span>Head Teachers:</span> 145</li>
                  <li><span>Sport Teachers:</span> 289</li>
                </ul>
              </div>
              
              <div className="report-card">
                <h4>Geographic Coverage</h4>
                <ul className="report-list">
                  <li><span>Zones:</span> 5</li>
                  <li><span>Regions:</span> 18</li>
                  <li><span>Districts:</span> 89</li>
                  <li><span>Wards:</span> 320</li>
                  <li><span>Schools:</span> 145</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

